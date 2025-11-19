from rest_framework import serializers
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'

class TransacaoSerializer(serializers.ModelSerializer):
    # Nested Serializer: Traz os pagamentos completos dentro da transação
    pagamentos = PagamentoSerializer(many=True, read_only=True)
    
    # Campos calculados para facilitar o Frontend
    saldo_restante = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cliente_nome = serializers.CharField(source='agendamento.cliente.username', read_only=True)

    class Meta:
        model = Transacao
        fields = '__all__'

class DespesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Despesa
        fields = '__all__'
        # A MÁGICA ESTÁ AQUI:
        # Dizemos ao Django: "Não exija o usuario na entrada, eu cuido disso no backend"
        read_only_fields = ('usuario',)

class CalculadoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculadoraPrecificacao
        fields = '__all__'