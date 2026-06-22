# iot/models.py — ATUALIZADO para pagamento dividido

from django.db import models
from django.conf import settings


class AtendimentoAtivo(models.Model):
    """
    Representa qual agendamento está "selecionado" no Painel de Bancada.

    NOVO nesta versão: suporte a pagamento dividido em múltiplas formas.
    valor_total_esperado é o preço do serviço (vindo do agendamento ou
    informado manualmente para walk-in). valor_acumulado é a soma das
    parcelas já registradas. Quando valor_acumulado == valor_total_esperado,
    o atendimento é considerado pago e o contexto é encerrado.
    """

    empreendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="atendimentos_ativos",
    )

    agendamento = models.ForeignKey(
        "agendamentos.Agendamento",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contextos_ativos",
    )

    nome_cliente_exibicao = models.CharField(max_length=100)

    # ─── NOVO: suporte a pagamento dividido ───
    valor_total_esperado = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Preço do serviço. Null = modo livre (sem total definido)."
    )
    valor_acumulado = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Soma das parcelas já registradas para este atendimento."
    )

    is_ativo = models.BooleanField(default=True)
    selecionado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["empreendedor"],
                condition=models.Q(is_ativo=True),
                name="unico_atendimento_ativo_por_empreendedor",
            )
        ]

    @property
    def valor_restante(self):
        """Quanto ainda falta pagar. None se não houver total definido."""
        if self.valor_total_esperado is None:
            return None
        return float(self.valor_total_esperado) - float(self.valor_acumulado)

    @property
    def esta_completo(self):
        """True quando o acumulado bateu (ou passou) o total esperado."""
        if self.valor_total_esperado is None:
            return False  # modo livre nunca "completa" automaticamente
        return float(self.valor_acumulado) >= float(self.valor_total_esperado)

    def __str__(self):
        status = "ATIVO" if self.is_ativo else "finalizado"
        return f"{self.nome_cliente_exibicao} ({status}) — {self.empreendedor}"


class ParcelaPagamento(models.Model):
    """
    NOVO MODEL: cada parcela de um pagamento dividido.
    Uma Transacao pode ter N ParcelaPagamento (uma por forma usada).

    Exemplo: atendimento de R$ 120 pago em R$ 60 dinheiro + R$ 60 Pix
    gera 2 registros aqui, ambos vinculados à mesma Transacao.
    """

    FORMA_CHOICES = [
        ("PIX", "Pix"),
        ("CARTAO", "Cartão"),
        ("DINHEIRO", "Dinheiro"),
        ("FIADO", "Fiado"),
    ]

    transacao = models.ForeignKey(
        "financeiro.Transacao",
        on_delete=models.CASCADE,
        related_name="parcelas",
    )
    forma_pagamento = models.CharField(max_length=10, choices=FORMA_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    registrado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.forma_pagamento}: R$ {self.valor} (Transação #{self.transacao_id})"