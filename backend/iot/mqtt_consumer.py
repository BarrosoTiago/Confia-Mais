import json
import logging
from django.db import models
from django.utils import timezone

from .mqtt_client import get_mqtt_client
from .mqtt_publisher import publicar_atendimento_limpo, publicar_alerta
from .models import AtendimentoAtivo

logger = logging.getLogger("iot.consumer")

TOPICO_SERVICO_INICIO      = "confia/servico/inicio"
TOPICO_PAGAMENTO_CONCLUSAO = "confia/pagamento/conclusao"
TOPICO_SERVICO_CANCELAR    = "confia/servico/cancelar"

EMPREENDEDOR_ID_PROTOTIPO = 1

# Mapeamento do payload do ESP32 para os choices do modelo
FORMA_MAP = {
    "PIX":      "PIX",
    "DINHEIRO": "DINHEIRO",
    "CARTAO":   "CARTAO_CREDITO",  # ESP32 não distingue débito/crédito
    "FIADO":    "FIADO",
}


def _buscar_contexto_ativo(empreendedor_id: int) -> AtendimentoAtivo | None:
    return AtendimentoAtivo.objects.filter(
        empreendedor_id=empreendedor_id, is_ativo=True
    ).first()


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Consumer MQTT conectado ao broker.")
        client.subscribe(TOPICO_SERVICO_INICIO, qos=1)
        client.subscribe(TOPICO_PAGAMENTO_CONCLUSAO, qos=1)
        client.subscribe(TOPICO_SERVICO_CANCELAR, qos=1)
        logger.info("Assinado: inicio, pagamento/conclusao, cancelar")
    else:
        logger.error(f"Falha ao conectar ao broker MQTT, rc={rc}")


def _on_message(client, userdata, msg):
    topico = msg.topic
    try:
        payload = json.loads(msg.payload.decode())
    except json.JSONDecodeError:
        logger.warning(f"Payload inválido em {topico}: {msg.payload}")
        return

    logger.info(f"MQTT recebido [{topico}]: {payload}")

    try:
        if topico == TOPICO_SERVICO_INICIO:
            _processar_inicio_servico(payload)
        elif topico == TOPICO_PAGAMENTO_CONCLUSAO:
            _processar_pagamento_concluido(payload)
        elif topico == TOPICO_SERVICO_CANCELAR:
            _processar_cancelamento(payload)
    except Exception:
        logger.exception(f"Erro ao processar mensagem do tópico {topico}")
        publicar_alerta(EMPREENDEDOR_ID_PROTOTIPO, "Erro no servidor")


def _processar_inicio_servico(payload: dict):
    contexto = _buscar_contexto_ativo(EMPREENDEDOR_ID_PROTOTIPO)

    if not contexto:
        logger.warning("Inicio recebido sem AtendimentoAtivo definido!")
        publicar_alerta(EMPREENDEDOR_ID_PROTOTIPO, "Selecione um cliente")
        return

    if contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "CONFIRMADO"  # ou EM_ATENDIMENTO se existir no seu model
        agendamento.save(update_fields=["status"])
        logger.info(f"Agendamento {agendamento.id} → atendimento iniciado")
    else:
        logger.info(f"Walk-in iniciado: {contexto.nome_cliente_exibicao}")


def _processar_pagamento_concluido(payload: dict):
    from financeiro.models import Transacao, Pagamento

    contexto = _buscar_contexto_ativo(EMPREENDEDOR_ID_PROTOTIPO)
    if not contexto:
        logger.warning("Pagamento recebido sem AtendimentoAtivo definido!")
        publicar_alerta(EMPREENDEDOR_ID_PROTOTIPO, "Contexto perdido")
        return

    forma_raw = payload.get("forma", "DINHEIRO")
    forma     = FORMA_MAP.get(forma_raw, "DINHEIRO")  # fallback seguro
    valor     = float(payload.get("valor", 0.0))

    agendamento = contexto.agendamento

    if agendamento:
        # 1) Conclui o agendamento
        agendamento.status = "CONCLUIDO"
        agendamento.save(update_fields=["status"])

        # 2) Cria ou recupera a Transacao
        transacao, _ = Transacao.objects.get_or_create(
            agendamento=agendamento,
            defaults={"valor_total": valor, "status_pagamento": "PENDENTE"},
        )

        if forma == "FIADO":
            # Fiado: registra o pagamento mas marca como pendente
            Pagamento.objects.create(
                transacao=transacao,
                valor=valor,
                forma_pagamento="FIADO",
                observacao="Fiado — registrado via Painel IoT",
            )
            transacao.status_pagamento = "PENDENTE"
            transacao.save(update_fields=["status_pagamento"])
            logger.info(f"Fiado registrado: R$ {valor} — agendamento {agendamento.id}")
        else:
            # PIX, DINHEIRO, CARTAO_CREDITO
            Pagamento.objects.create(
                transacao=transacao,
                valor=valor,
                forma_pagamento=forma,
                observacao=f"Registrado via Painel IoT ({forma_raw})",
            )
            total_pago = transacao.pagamentos.aggregate(
                total=models.Sum('valor')
            )['total'] or 0

            transacao.valor_pago = total_pago
            transacao.status_pagamento = (
                "PAGO"    if total_pago >= transacao.valor_total else
                "PARCIAL" if total_pago > 0 else
                "PENDENTE"
            )
            transacao.save(update_fields=["valor_pago", "status_pagamento"])
            logger.info(
                f"Pagamento salvo: {forma} R$ {valor} "
                f"({transacao.status_pagamento}) — agendamento {agendamento.id}"
            )
    else:
        logger.info(f"Walk-in concluído: {contexto.nome_cliente_exibicao} — R$ {valor} ({forma_raw})")

    # 3) Libera o painel
    contexto.is_ativo = False
    contexto.finalizado_em = timezone.now()
    contexto.save(update_fields=["is_ativo", "finalizado_em"])
    publicar_atendimento_limpo(EMPREENDEDOR_ID_PROTOTIPO)


def _processar_cancelamento(payload: dict):
    contexto = _buscar_contexto_ativo(EMPREENDEDOR_ID_PROTOTIPO)

    if contexto and contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "PENDENTE"
        agendamento.save(update_fields=["status"])
        logger.info(f"Agendamento {agendamento.id} revertido para PENDENTE")


def iniciar_consumer():
    client = get_mqtt_client()
    client.on_connect = _on_connect
    client.on_message = _on_message

    if client.is_connected():
        _on_connect(client, None, None, 0)

    logger.info("Consumer do Painel de Bancada IoT iniciado.")