from rest_framework import serializers
from .models import Agendamento, HorarioFuncionamento, Avaliacao, Despesa, Pagamento, Anotacao
from servicos.models import Servico
from datetime import timedelta
from django.utils import timezone

# --- SERIALIZER DE DESPESAS 💸 ---
class DespesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Despesa
        fields = ['id', 'descricao', 'valor', 'data', 'categoria']

# --- SERIALIZER DE PAGAMENTOS 💰 ---
class PagamentoSerializer(serializers.ModelSerializer):
    data_formatada = serializers.DateTimeField(source='data', format="%d/%m/%Y %H:%M", read_only=True)
    
    class Meta:
        model = Pagamento
        fields = ['id', 'valor', 'forma', 'data', 'data_formatada', 'observacao', 'agendamento']

# --- SERIALIZERS DE AVALIAÇÃO ---
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

# --- SERIALIZER DE AGENDAMENTO (PRINCIPAL) ---
class AgendamentoSerializer(serializers.ModelSerializer):
    servicos = serializers.PrimaryKeyRelatedField(
        queryset=Servico.objects.all(), 
        many=True
    )
    
    avaliacao = AvaliacaoSerializer(read_only=True)

    # A CLASSE META É OBRIGATÓRIA
    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ('data_hora_fim',) 
        extra_kwargs = {
            'cliente': {'required': False}
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # --- 1. LÓGICA FINANCEIRA (NOVA) ---
        total_servico = sum([s.preco for s in instance.servicos.all()])
        total_pago = sum([p.valor for p in instance.pagamentos.all()])
        restante = total_servico - total_pago

        if restante <= 0 and total_servico > 0:
            status_pagamento = 'QUITADO'
        elif total_pago > 0:
            status_pagamento = 'PARCIAL'
        else:
            status_pagamento = 'PENDENTE'

        representation['financeiro'] = {
            'total': total_servico,
            'pago': total_pago,
            'restante': restante,
            'status_pagamento': status_pagamento
        }
        
        # --- 2. DETALHES VISUAIS ---
        servicos_data = []
        nome_loja_principal = "Loja Parceira"
        
        for s in instance.servicos.all():
            dono = s.criado_por
            nome_dono = "Desconhecido"
            if dono:
                nome_dono = dono.nome_completo or dono.username
                if nome_loja_principal == "Loja Parceira":
                    nome_loja_principal = nome_dono

            servicos_data.append({
                "id": s.id, 
                "nome": s.nome, 
                "preco": s.preco,
                "criado_por_nome": nome_dono 
            })

        representation['servicos_detalhes'] = servicos_data
        representation['nome_loja'] = nome_loja_principal

        # Detalhes do Cliente
        try:
            representation['cliente_nome'] = instance.cliente.nome_completo or instance.cliente.username
            representation['cliente_telefone'] = instance.cliente.telefone or ""
        except:
            representation['cliente_nome'] = "Desconhecido"
            representation['cliente_telefone'] = ""
            
        return representation

    def validate(self, attrs):
        if self.instance:
            inicio = attrs.get('data_hora_inicio', self.instance.data_hora_inicio)
            servicos_selecionados = attrs.get('servicos', self.instance.servicos.all())
        else:
            inicio = attrs.get('data_hora_inicio')
            servicos_selecionados = attrs.get('servicos')

        if not inicio: return attrs 

        # Validação de Passado
        if inicio < timezone.now():
             raise serializers.ValidationError({"data_hora_inicio": "Não é possível agendar para o passado."})

        if not servicos_selecionados:
             raise serializers.ValidationError({"servicos": "Selecione serviços."})

        duracao_total = sum([getattr(s, 'duracao_minutos', 30) for s in servicos_selecionados])
        fim = inicio + timedelta(minutes=duracao_total)

        # Validação de Horário
        primeiro_servico = servicos_selecionados[0] if isinstance(servicos_selecionados, list) else servicos_selecionados.first()

        if primeiro_servico and primeiro_servico.criado_por:
            dono_servico = primeiro_servico.criado_por 
            dia_semana = inicio.weekday()
            
            try:
                regra = HorarioFuncionamento.objects.get(dia_semana=dia_semana, usuario=dono_servico)
                
                if not regra.ativo:
                    raise serializers.ValidationError({"data_hora_inicio": f"Fechado na {regra.get_dia_semana_display()}."})

                hora_inicio = inicio.time()
                hora_fim = fim.time()

                if (hora_inicio < regra.horario_inicio or hora_fim > regra.horario_fim):
                    raise serializers.ValidationError({"data_hora_inicio": "Fora do horário de expediente."})
                
                if regra.almoco_inicio and regra.almoco_fim:
                    caiu_no_almoco = (hora_inicio >= regra.almoco_inicio and hora_inicio < regra.almoco_fim) or \
                                     (hora_fim > regra.almoco_inicio and hora_fim <= regra.almoco_fim)
                    if caiu_no_almoco:
                        raise serializers.ValidationError({"data_hora_inicio": "Horário de intervalo/almoço."})

            except HorarioFuncionamento.DoesNotExist:
                raise serializers.ValidationError({
                    "data_hora_inicio": "O estabelecimento não configurou os horários para este dia."
                })
            
        # Validação de Conflitos
        conflitos = Agendamento.objects.filter(
            data_hora_inicio__lt=fim,
            data_hora_fim__gt=inicio,
            status__in=['PENDENTE', 'CONFIRMADO'],
            servicos__criado_por=dono_servico
        )

        if self.instance:
            conflitos = conflitos.exclude(id=self.instance.id)

        if conflitos.exists():
             raise serializers.ValidationError({"data_hora_inicio": "Este horário já está ocupado."})

        attrs['data_hora_fim'] = fim
        return attrs

# --- SERIALIZER DE HORÁRIOS ---
class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioFuncionamento
        fields = ['id', 'dia_semana', 'horario_inicio', 'horario_fim', 'almoco_inicio', 'almoco_fim', 'ativo']
        read_only_fields = ('usuario',)

    def validate(self, attrs):
        user = self.context['request'].user
        dia = attrs.get('dia_semana')
        if not self.instance and HorarioFuncionamento.objects.filter(usuario=user, dia_semana=dia).exists():
            raise serializers.ValidationError({"dia_semana": "Dia já configurado."})
        return attrs

class AnotacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anotacao
        fields = '__all__'