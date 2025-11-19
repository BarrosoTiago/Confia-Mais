from django.db import models
from django.conf import settings
from agendamentos.models import Agendamento
from django.db.models import Sum

class CalculadoraPrecificacao(models.Model):
    """
    Armazena os custos fixos e metas do empreendedor para calcular o preço ideal.
    Relação 1:1 com o Usuário (Admin).
    """
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='calculadora'
    )
    custo_fixo_mensal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    horas_trabalho_mes = models.IntegerField(default=160, help_text="Ex: 160h (8h/dia)")
    margem_lucro_padrao = models.DecimalField(max_digits=5, decimal_places=2, default=20.0, help_text="Em porcentagem (%)")
    
    def __str__(self):
        return f"Calculadora de {self.usuario}"

class Despesa(models.Model):
    """
    Contas a pagar (Luz, Internet, Aluguel, Materiais).
    """
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    descricao = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_despesa = models.DateField()
    categoria = models.CharField(max_length=50, blank=True, null=True) # Ex: Fixo, Variável

    def __str__(self):
        return f"{self.descricao} - R$ {self.valor}"

class Transacao(models.Model):
    """
    Representa a COBRANÇA gerada pelo agendamento.
    O 'Pai' dos pagamentos.
    """
    STATUS_PAGAMENTO = (
        ('PENDENTE', 'Pendente'),
        ('PARCIAL', 'Parcialmente Pago'),
        ('PAGO', 'Pago'),
        ('ESTORNADO', 'Estornado'),
    )
    
    # Ligação com o Agendamento
    agendamento = models.OneToOneField(
        Agendamento, 
        on_delete=models.CASCADE,
        related_name='transacao'
    )
    
    # Valores acumulados (Calculados automaticamente)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Total (R$)")
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Já Pago (R$)")
    
    status_pagamento = models.CharField(max_length=20, choices=STATUS_PAGAMENTO, default='PENDENTE')
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    def saldo_restante(self):
        return self.valor_total - self.valor_pago

    # <--- NOVO: Adicione este método SAVE
    def save(self, *args, **kwargs):
        # Se não tem valor total definido, calcula com base nos serviços do agendamento
        if not self.valor_total:
            total = self.agendamento.servicos.aggregate(Sum('preco'))['preco__sum'] or 0
            self.valor_total = total
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Fatura #{self.id} - {self.status_pagamento}"
    
class Pagamento(models.Model):
    """
    Cada parcela ou aporte de dinheiro referente a uma Transação.
    """
    FORMAS_PAGAMENTO = (
        ('PIX', 'Pix'),
        ('DINHEIRO', 'Dinheiro'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('BOLETO', 'Boleto'),
    )

    transacao = models.ForeignKey(
        Transacao, 
        on_delete=models.CASCADE,
        related_name='pagamentos'
    )
    
    valor = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Pago")
    data_pagamento = models.DateTimeField(auto_now_add=True) # Mudei para auto_now_add para facilitar
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO)
    observacao = models.CharField(max_length=255, blank=True, null=True, help_text="Ex: Entrada de 50%")

    def __str__(self):
        return f"Pagamento de R$ {self.valor} em {self.transacao}"