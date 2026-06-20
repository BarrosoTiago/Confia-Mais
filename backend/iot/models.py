# iot/models.py
#
# Modelo que representa o "contexto ativo" do Painel de Bancada.
# Resolve o problema de "qual agendamento está sendo atendido":
# o app define este contexto ANTES do profissional usar o teclado físico.

from django.db import models
from django.conf import settings


class AtendimentoAtivo(models.Model):
    """
    Representa qual agendamento está "selecionado" no Painel de Bancada
    de um determinado empreendedor, em um dado momento.

    Fluxo:
    1. Profissional abre o app e toca no agendamento (ou em "sem agendamento")
    2. App chama a API que cria/atualiza este registro e publica via MQTT
    3. ESP32 assina o tópico e exibe o nome do cliente no LCD
    4. Quando o pagamento é concluído, o consumer usa este registro para
       saber qual Agendamento/Transacao atualizar — sem ambiguidade.
    5. Após concluir ou cancelar, o registro é limpo (is_ativo=False).

    Cada empreendedor tem no máximo UM atendimento ativo por vez —
    é exatamente o que sincroniza com o estado físico do dispositivo.
    """

    empreendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="atendimentos_ativos",
    )

    # Pode ser nulo: cobre o caso de "walk-in" (cliente sem agendamento prévio)
    agendamento = models.ForeignKey(
        "agendamentos.Agendamento",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contextos_ativos",
    )

    # Guardamos o nome separadamente para os casos de walk-in
    # (sem agendamento) e para exibir no LCD sem precisar de outro JOIN.
    nome_cliente_exibicao = models.CharField(max_length=100)

    is_ativo = models.BooleanField(default=True)
    selecionado_em = models.DateTimeField(auto_now_add=True)
    finalizado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        # Garante, a nível de banco, que um empreendedor não tenha
        # dois contextos "ativos" simultâneos — evita condição de corrida
        # entre o app e o teclado físico.
        constraints = [
            models.UniqueConstraint(
                fields=["empreendedor"],
                condition=models.Q(is_ativo=True),
                name="unico_atendimento_ativo_por_empreendedor",
            )
        ]

    def __str__(self):
        status = "ATIVO" if self.is_ativo else "finalizado"
        return f"{self.nome_cliente_exibicao} ({status}) — {self.empreendedor}"