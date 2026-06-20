from django.db import models
from django.conf import settings
from agendamentos.models import Agendamento
from django.db.models import Sum

class CalculadoraPrecificacao(models.Model):
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='calculadora'
    )
    custo_fixo_mensal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    horas_trabalho_mes = models.IntegerField(default=160)
    margem_lucro_padrao = models.DecimalField(max_digits=5, decimal_places=2, default=20.0)
    
    def __str__(self):
        return f"Calculadora de {self.usuario}"


class Despesa(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    descricao = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_despesa = models.DateField()
    categoria = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.descricao} - R$ {self.valor}"


class Transacao(models.Model):
    STATUS_PAGAMENTO = (
        ('PENDENTE', 'Pendente'),
        ('PARCIAL', 'Parcialmente Pago'),
        ('PAGO', 'Pago'),
        ('ESTORNADO', 'Estornado'),
    )
    
    agendamento = models.OneToOneField(
        Agendamento, 
        on_delete=models.CASCADE,
        related_name='transacao'
    )
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status_pagamento = models.CharField(max_length=20, choices=STATUS_PAGAMENTO, default='PENDENTE')
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    def saldo_restante(self):
        return self.valor_total - self.valor_pago

    def save(self, *args, **kwargs):
        if not self.valor_total:
            total = self.agendamento.servicos.aggregate(Sum('preco'))['preco__sum'] or 0
            self.valor_total = total
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Fatura #{self.id} - {self.status_pagamento}"


class Pagamento(models.Model):
    FORMAS_PAGAMENTO = (
        ('PIX', 'Pix'),
        ('DINHEIRO', 'Dinheiro'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('BOLETO', 'Boleto'),
        ('FIADO', 'Fiado'),          # ← ADICIONADO
    )

    transacao = models.ForeignKey(
        Transacao, 
        on_delete=models.CASCADE,
        related_name='pagamentos'
    )
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_pagamento = models.DateTimeField(auto_now_add=True)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO)
    observacao = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Pagamento de R$ {self.valor} em {self.transacao}"