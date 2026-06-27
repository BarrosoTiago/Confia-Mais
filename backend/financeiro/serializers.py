from rest_framework import serializers
from django.db.models import Sum
from .models import Transacao, Pagamento, Despesa, CalculadoraPrecificacao

# --- SERIALIZER DE PAGAMENTOS (ATUALIZADO COM VALIDAÇÃO ANTI-ESTORNO) ---
class PagamentoSerializer(serializers.ModelSerializer):
    # Definimos explicitamente como campo de escrita para capturá-lo no validate
    agendamento = serializers.IntegerField(write_only=True, required=False)
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

    def validate(self, data):
        valor_novo_aporte = data.get('valor', 0)
        agendamento_id = data.get('agendamento')
        transacao = data.get('transacao')

        # 1. Garante a existência e amarração da Transação Pai
        if agendamento_id and not transacao:
            transacao, created = Transacao.objects.get_or_create(
                agendamento_id=agendamento_id,
                defaults={'valor_total': 0}
            )
            data['transacao'] = transacao

        if transacao:
            # 2. CORREÇÃO CRÍTICA: Busca o valor total direto da tabela de Agendamento
            # para evitar o retorno falso de valor zerado (0)
            agendamento_real = transacao.agendamento
            total_servicos = agendamento_real.servicos.aggregate(total=Sum('preco'))['total'] or 0
            
            # Se ainda assim o Django falhar em agregar pelo relacionamento reverso,
            # usamos uma rota de fuga manual somando os valores na memória:
            if total_servicos == 0:
                total_servicos = sum([s.preco for s in agendamento_real.servicos.all()])

            # Atualiza e salva o valor total real na transação pai
            transacao.valor_total = total_servicos
            transacao.save()

            # 3. Calcula o montante histórico já pago
            pagamentos_query = transacao.pagamentos.all()
            if self.instance:
                pagamentos_query = pagamentos_query.exclude(id=self.instance.id)
                
            total_ja_pago = pagamentos_query.aggregate(total=Sum('valor'))['total'] or 0
            
            # 4. Define o teto máximo permitido
            saldo_restante = total_servicos - total_ja_pago

            # 5. Validação com tolerância para pequenas imprecisões de ponto flutuante
            if valor_novo_aporte > saldo_restante:
                raise serializers.ValidationError({
                    "valor": f"Valor excede o limite! O saldo restante exato é R$ {saldo_restante}, mas o valor processado foi R$ {valor_novo_aporte}."
                })

        return data

    def create(self, validated_data):
        # Remove o campo auxiliar que usamos apenas na validação
        validated_data.pop('agendamento', None)
        return super().create(validated_data)

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
    data = serializers.DateField(source='data_despesa')

    class Meta:
        model = Despesa
        fields = ['id', 'descricao', 'valor', 'data', 'categoria', 'usuario', 'pago']
        read_only_fields = ('usuario',)

# --- SERIALIZER DA CALCULADORA (Mantenha como está) ---
class CalculadoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculadoraPrecificacao
        fields = '__all__'
        read_only_fields = ('usuario',)


        