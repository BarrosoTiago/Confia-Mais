from django.db import models
from django.conf import settings
from django.db.models.signals import post_save, m2m_changed 
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
        ('EM_ABERTO', 'Em Aberto'),       # NOVO: Necessário para suportar parcelas do IoT
        ('PARCIAL', 'Parcialmente Pago'),
        ('PAGO', 'Pago'),
        ('ESTORNADO', 'Estornado'),
    )
    
    agendamento = models.OneToOneField(
        Agendamento, 
        on_delete=models.CASCADE,
        related_name='transacao'
    )
    
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Total (R$)")
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total Já Pago (R$)")
    status_pagamento = models.CharField(max_length=20, choices=STATUS_PAGAMENTO, default='PENDENTE')
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    def saldo_restante(self):
        return self.valor_total - self.valor_pago

    def recalcular_totais(self):
        if self.agendamento_id:
            total_servicos = self.agendamento.servicos.aggregate(total=Sum('preco'))['total'] or 0
            if total_servicos == 0:
                total_servicos = sum([s.preco for s in self.agendamento.servicos.all()])
            self.valor_total = total_servicos

        total_pago = self.pagamentos.aggregate(total=Sum('valor'))['total'] or 0
        self.valor_pago = total_pago

        if self.valor_pago >= self.valor_total and self.valor_total > 0:
            self.status_pagamento = 'PAGO'
        elif self.valor_pago > 0:
            self.status_pagamento = 'PARCIAL'
        else:
            self.status_pagamento = 'PENDENTE'
            
        super().save()

    def save(self, *args, **kwargs):
        if not self.valor_total and self.agendamento_id:
            total = self.agendamento.servicos.aggregate(total=Sum('preco'))['total'] or 0
            self.valor_total = total
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Fatura #{self.id} - {self.status_pagamento} (Agendamento {self.agendamento_id})"
    

class Pagamento(models.Model):
    """
    Cada parcela ou aporte de dinheiro referente a uma Transação.
    """
    FORMAS_PAGAMENTO = (
        ('PIX', 'Pix'),
        ('DINHEIRO', 'Dinheiro'),
        ('CARTAO_CREDITO', 'Cartão de Crédito'),
        ('CARTAO_DEBITO', 'Cartão de Débito'),
        ('CARTAO', 'Cartão'), # NOVO: Vindo do ESP32
        ('BOLETO', 'Boleto'),
        ('FIADO', 'Fiado'),   # NOVO: Vindo do ESP32
    )

    transacao = models.ForeignKey(
        Transacao, 
        on_delete=models.CASCADE,
        related_name='pagamentos'
    )
    
    valor = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor Pago")
    data_pagamento = models.DateTimeField(auto_now_add=True)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO)
    observacao = models.CharField(max_length=255, blank=True, null=True, help_text="Ex: Entrada de 50%")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.transacao:
            self.transacao.recalcular_totais()

    def delete(self, *args, **kwargs):
        transacao = self.transacao
        super().delete(*args, **kwargs)
        transacao.recalcular_totais()

    def __str__(self):
        return f"Pagamento de R$ {self.valor} em {self.transacao}"