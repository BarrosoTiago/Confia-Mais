# iot/mqtt_consumer.py
#
# CONSUMER: assina os tópicos que o ESP32 PUBLICA e executa a lógica
# de negócio correspondente — usando o contexto definido em AtendimentoAtivo
# para saber, sem ambiguidade, qual agendamento está sendo processado.
#
# Roda em background desde que o Django inicia (ver apps.py).

import json
import logging
from datetime import timedelta

from django.utils import timezone

from .mqtt_client import get_mqtt_client
from .mqtt_publisher import publicar_atendimento_limpo, publicar_alerta
from .models import AtendimentoAtivo

logger = logging.getLogger("iot.consumer")

TOPICO_SERVICO_INICIO = "confia/servico/inicio"
TOPICO_PAGAMENTO_CONCLUSAO = "confia/pagamento/conclusao"
TOPICO_SERVICO_CANCELAR = "confia/servico/cancelar"

# IMPORTANTE: em produção real, o tópico precisaria incluir o ID do
# empreendedor (ex: confia/{empreendedor_id}/pagamento/conclusao) para
# suportar múltiplos painéis simultâneos. Para o protótipo de um único
# dispositivo, mantemos os tópicos fixos e assumimos um empreendedor.
EMPREENDEDOR_ID_PROTOTIPO = 1  # ajustar/parametrizar depois


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
        logger.warning(f"Payload inválido recebido em {topico}: {msg.payload}")
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
    """
    O ESP32 publicou que o profissional iniciou um atendimento.
    Busca o contexto ativo (definido previamente pelo app) e,
    se existir um agendamento vinculado, muda seu status.
    """
    contexto = _buscar_contexto_ativo(EMPREENDEDOR_ID_PROTOTIPO)

    if not contexto:
        # Isso só deveria acontecer se o firmware tiver um bug,
        # já que ele bloqueia o início sem contexto — mas tratamos
        # defensivamente do lado do servidor também.
        logger.warning("Inicio recebido sem AtendimentoAtivo definido!")
        publicar_alerta(EMPREENDEDOR_ID_PROTOTIPO, "Selecione um cliente")
        return

    if contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "EM_ATENDIMENTO"
        agendamento.hora_inicio_real = timezone.now()
        agendamento.save(update_fields=["status", "hora_inicio_real"])
        logger.info(f"Agendamento {agendamento.id} → EM_ATENDIMENTO")
    else:
        # Walk-in: não há agendamento prévio no banco, só o nome
        logger.info(f"Atendimento walk-in iniciado: {contexto.nome_cliente_exibicao}")


def _processar_pagamento_concluido(payload: dict):
    """
    Payload esperado do ESP32:
    {
        "forma": "PIX" | "CARTAO" | "DINHEIRO" | "FIADO",
        "valor": 120.00,
        "duracao_segundos": 1820,
        "status_pagamento": "PAGO" | "PENDENTE"
    }
    """
    from financeiro.models import Pagamento, Transacao  # ajuste aos seus apps reais

    contexto = _buscar_contexto_ativo(EMPREENDEDOR_ID_PROTOTIPO)

    if not contexto:
        logger.warning("Pagamento recebido sem AtendimentoAtivo definido!")
        publicar_alerta(EMPREENDEDOR_ID_PROTOTIPO, "Contexto perdido")
        return

    forma = payload.get("forma")
    valor = payload.get("valor", 0.0)
    duracao_segundos = payload.get("duracao_segundos", 0)
    status_pagamento = payload.get("status_pagamento", "PAGO")

    agendamento = contexto.agendamento

    # 1) Conclui o agendamento, se houver um vinculado
    if agendamento:
        agendamento.status = "CONCLUIDO"
        agendamento.hora_fim_real = timezone.now()
        agendamento.duracao_real_segundos = duracao_segundos
        agendamento.save(update_fields=[
            "status", "hora_fim_real", "duracao_real_segundos"
        ])

    # 2) Cria a transação financeira com o valor REAL digitado no teclado
    #    (em vez de assumir o preço cadastrado do serviço)
    transacao = Transacao.objects.create(
        usuario_id=EMPREENDEDOR_ID_PROTOTIPO,
        agendamento=agendamento,
        valor_total=valor,
        status_pagamento=status_pagamento,  # PAGO ou PENDENTE (fiado)
    )

    Pagamento.objects.create(
        transacao=transacao,
        valor_pago=valor if status_pagamento == "PAGO" else 0,
        forma_pagamento=forma,
        data_pagamento=timezone.now(),
        observacoes="Registrado via Painel de Bancada IoT",
    )

    logger.info(
        f"Pagamento registrado: {forma} R$ {valor} "
        f"({status_pagamento}) — cliente {contexto.nome_cliente_exibicao}"
    )

    # 3) Encerra o contexto ativo — o painel volta a ficar livre
    contexto.is_ativo = False
    contexto.finalizado_em = timezone.now()
    contexto.save(update_fields=["is_ativo", "finalizado_em"])

    publicar_atendimento_limpo(EMPREENDEDOR_ID_PROTOTIPO)

    # 4) (Opcional) Aqui é o ponto natural para disparar um WebSocket
    #    via Django Channels, notificando o app mobile em tempo real:
    #
    # from channels.layers import get_channel_layer
    # from asgiref.sync import async_to_sync
    # channel_layer = get_channel_layer()
    # async_to_sync(channel_layer.group_send)(
    #     f"dashboard_{EMPREENDEDOR_ID_PROTOTIPO}",
    #     {"type": "pagamento_concluido", "valor": valor, "forma": forma},
    # )


def _processar_cancelamento(payload: dict):
    """
    O profissional cancelou o atendimento pelo teclado físico
    (pressionou * na tela de aguardar forma de pagamento).
    Reverte o agendamento para PENDENTE, se houver um vinculado.
    """
    contexto = _buscar_contexto_ativo(EMPREENDEDOR_ID_PROTOTIPO)

    if contexto and contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "PENDENTE"
        agendamento.hora_inicio_real = None
        agendamento.save(update_fields=["status", "hora_inicio_real"])
        logger.info(f"Agendamento {agendamento.id} revertido para PENDENTE")

    # Nota: o cancelamento do teclado (Estado AGUARDANDO_FORMA → EM_ATENDIMENTO)
    # NÃO encerra o contexto ativo — só o cancelamento que volta para LIVRE faria
    # isso. Ajuste esta lógica conforme o firmware evoluir.


def iniciar_consumer():
    """
    Ponto de entrada chamado pelo apps.py no startup do Django.
    Conecta ao broker e registra os callbacks. A conexão roda em
    thread própria do paho-mqtt (client.loop_start() dentro de
    get_mqtt_client), então esta função não bloqueia o servidor.
    """
    client = get_mqtt_client()
    client.on_connect = _on_connect
    client.on_message = _on_message

    # Garante que on_connect seja chamado mesmo se já estava conectado
    # antes dos callbacks serem atribuídos
    if client.is_connected():
        _on_connect(client, None, None, 0)

    logger.info("Consumer do Painel de Bancada IoT iniciado.")