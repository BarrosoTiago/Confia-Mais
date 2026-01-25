from rest_framework import serializers
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao

# --- SERIALIZER DE PAGAMENTOS (Mantenha como está) ---
class PagamentoSerializer(serializers.ModelSerializer):
    agendamento = serializers.IntegerField(required=False)
    agendamento_id = serializers.ReadOnlyField(source='transacao.agendamento.id')
    data_formatada = serializers.DateTimeField(
        source='data_pagamento', 
        format="%d/%m/%Y às %H:%M", 
        read_only=True
    )

    class Meta:
        model = Pagamento
        fields = '__all__'
        extra_kwargs = {
            'transacao': {'required': False, 'allow_null': True},
            'forma_pagamento': {'required': True}
        }

    def create(self, validated_data):
        validated_data.pop('agendamento', None)
        return super().create(validated_data)

    def to_internal_value(self, data):
        if 'forma_pagamento' in data and isinstance(data['forma_pagamento'], str):
            val = data['forma_pagamento'].upper()
            if 'PIX' in val: data['forma_pagamento'] = 'PIX'
            elif 'CREDITO' in val or 'CARTAO' in val: data['forma_pagamento'] = 'CARTAO_CREDITO'
            elif 'DEBITO' in val: data['forma_pagamento'] = 'CARTAO_DEBITO'
            elif 'DINHEIRO' in val: data['forma_pagamento'] = 'DINHEIRO'
        return super().to_internal_value(data)

# --- SERIALIZER DE TRANSAÇÃO (Mantenha como está) ---
class TransacaoSerializer(serializers.ModelSerializer):
    pagamentos = PagamentoSerializer(many=True, read_only=True)
    saldo_restante = serializers.ReadOnlyField()
    cliente_nome = serializers.CharField(source='agendamento.cliente.nome_completo', read_only=True)
    
    class Meta:
        model = Transacao
        fields = '__all__'

# --- SERIALIZER DE DESPESA (ATUALIZADO) ---
class DespesaSerializer(serializers.ModelSerializer):
    # A mágica acontece aqui: mapeamos 'data' (React) para 'data_despesa' (Banco)
    data = serializers.DateField(source='data_despesa')

    class Meta:
        model = Despesa
        # Listamos os campos explicitamente para garantir a ordem e o novo campo 'data'
        fields = ['id', 'descricao', 'valor', 'data', 'categoria', 'usuario']
        read_only_fields = ('usuario',)

# --- SERIALIZER DA CALCULADORA (Mantenha como está) ---
class CalculadoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculadoraPrecificacao
        fields = '__all__'
        read_only_fields = ('usuario',)