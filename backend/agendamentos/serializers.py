from rest_framework import serializers
from .models import Agendamento, HorarioFuncionamento, Avaliacao, Anotacao
from servicos.models import Servico
from financeiro.models import Transacao, Pagamento
from django.db.models import Sum
from datetime import timedelta
from django.utils import timezone

# --- SERIALIZERS DE APOIO ---

class AvaliacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avaliacao
        fields = ['id', 'nota', 'comentario', 'criado_em']

class AvaliacaoPublicaSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.SerializerMethodField()
    data = serializers.DateTimeField(source='criado_em', format="%d/%m/%Y")

    class Meta:
        model = Avaliacao
        fields = ['id', 'cliente_nome', 'nota', 'comentario', 'data']

    def get_cliente_nome(self, obj):
        try:
            nome = obj.agendamento.cliente.nome_completo or obj.agendamento.cliente.username
            partes = nome.split()
            if len(partes) > 1:
                return f"{partes[0]} {partes[-1][0]}."
            return nome
        except:
            return "Cliente"

# --- SERIALIZER DE AGENDAMENTO (PRINCIPAL ATUALIZADO) ---

class AgendamentoSerializer(serializers.ModelSerializer):
    servicos = serializers.PrimaryKeyRelatedField(
        queryset=Servico.objects.all(), 
        many=True
    )
    avaliacao = AvaliacaoSerializer(read_only=True)

    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ('data_hora_fim',) 
        extra_kwargs = {
            'cliente': {'required': False}
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # --- LÓGICA FINANCEIRA SINCRONIZADA ---
        transacao = Transacao.objects.filter(agendamento=instance).first()
        
        total_servico = sum([s.preco for s in instance.servicos.all()])
        total_pago = 0
        data_ultima_confirmacao = None
        
        if transacao:
            # 1. Soma real dos pagamentos confirmados no app Financeiro
            total_pago = transacao.pagamentos.aggregate(Sum('valor'))['valor__sum'] or 0
            
            # 2. Captura a data/hora do último pagamento realizado
            ultimo_pagamento = transacao.pagamentos.order_by('-data_pagamento').first()
            if ultimo_pagamento:
                data_ultima_confirmacao = ultimo_pagamento.data_pagamento
        
        # --- NOVA REGRA DE NEGÓCIO ---
        # O valor "restante" só existe se o agendamento for CONFIRMADO.
        # Se for PENDENTE, o sistema não assume que esse dinheiro "virá" ainda.
        if instance.status == 'CONFIRMADO':
            restante = round(total_servico - total_pago, 2)
        else:
            # Se ainda for apenas um pedido, o restante "previsto" é 0
            # Mas mantemos o total_pago caso o cliente tenha enviado um sinal/antecipação
            restante = 0

        # 3. Definição do Status de Pagamento
        status_pagamento = 'PENDENTE'
        if total_servico > 0:
            if instance.status == 'CONFIRMADO' and restante <= 0:
                status_pagamento = 'QUITADO'
            elif total_pago > 0:
                status_pagamento = 'PARCIAL'

        # Objeto financeiro injetado na resposta para o React
        representation['financeiro'] = {
            'total': float(total_servico),
            'pago': float(total_pago),
            'restante': float(max(0, restante)),
            'status_pagamento': status_pagamento,
            'data_confirmacao': data_ultima_confirmacao.isoformat() if data_ultima_confirmacao else None
        }
        
        # Detalhes dos serviços e do profissional
        representation['servicos_detalhes'] = [
            {
                "id": s.id, 
                "nome": s.nome, 
                "preco": float(s.preco),
                "criado_por_nome": s.criado_por.nome_completo if s.criado_por else "Profissional"
            } for s in instance.servicos.all()
        ]

        try:
            representation['cliente_nome'] = instance.cliente.nome_completo or instance.cliente.username
            representation['cliente_telefone'] = instance.cliente.telefone or ""
        except:
            representation['cliente_nome'] = "Desconhecido"
            
        return representation

    def validate(self, attrs):
        inicio = attrs.get('data_hora_inicio', getattr(self.instance, 'data_hora_inicio', None))
        servicos = attrs.get('servicos', None)
        
        if servicos is None and self.instance:
            servicos_lista = self.instance.servicos.all()
        else:
            servicos_lista = servicos or []

        if inicio and servicos_lista:
            duracao = sum([getattr(s, 'duracao_minutos', 30) for s in servicos_lista])
            attrs['data_hora_fim'] = inicio + timedelta(minutes=duracao)
            
        return attrs

# --- OUTROS SERIALIZERS ---

class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioFuncionamento
        fields = ['id', 'dia_semana', 'horario_inicio', 'horario_fim', 'ativo']
        read_only_fields = ('usuario',)

class AnotacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anotacao
        fields = '__all__'