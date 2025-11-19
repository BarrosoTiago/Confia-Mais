from rest_framework import serializers
from .models import Agendamento
from servicos.models import Servico
from datetime import timedelta
from django.utils import timezone

class AgendamentoSerializer(serializers.ModelSerializer):
    servicos = serializers.PrimaryKeyRelatedField(
        queryset=Servico.objects.all(), 
        many=True
    )

    class Meta:
        model = Agendamento
        fields = '__all__'
        read_only_fields = ('cliente', 'data_hora_fim') # O fim nós calculamos sozinhos

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['servicos_detalhes'] = [
            {"id": s.id, "nome": s.nome, "preco": s.preco} for s in instance.servicos.all()
        ]
        representation['cliente_nome'] = instance.cliente.nome_completo or instance.cliente.username
        return representation

    def validate(self, attrs):
        """
        Aqui acontece a mágica da validação de disponibilidade.
        """
        inicio = attrs.get('data_hora_inicio')
        servicos_selecionados = attrs.get('servicos')

        # 1. Validação Básica: Data no Passado
        if inicio < timezone.now():
            raise serializers.ValidationError("Não é possível agendar para o passado.")

        # 2. Calcular a duração total e a Data Fim
        duracao_total = sum([s.duracao_minutos for s in servicos_selecionados])
        if duracao_total == 0:
            raise serializers.ValidationError("Selecione pelo menos um serviço.")
            
        fim = inicio + timedelta(minutes=duracao_total)

        # 3. Checar Colisão de Horário (Overlap)
        # Lógica: (InicioA < FimB) e (FimA > InicioB)
        conflitos = Agendamento.objects.filter(
            data_hora_inicio__lt=fim,  # Começa antes do meu fim
            data_hora_fim__gt=inicio   # Termina depois do meu início
        ).exclude(
            status='CANCELADO' # Ignora agendamentos cancelados
        )

        # Se estivermos editando um agendamento existente (PUT/PATCH), 
        # precisamos excluir ele mesmo da verificação para não dar conflito consigo mesmo.
        if self.instance:
            conflitos = conflitos.exclude(id=self.instance.id)

        if conflitos.exists():
            raise serializers.ValidationError(
                {"data_hora_inicio": "Já existe um agendamento para este horário."}
            )

        # 4. Injetar o valor calculado de 'data_hora_fim' nos dados para salvar no banco
        attrs['data_hora_fim'] = fim
        
        return attrs