# iot/mqtt_consumer.py — ATUALIZADO para pagamento dividido
#
# Mudança principal: confia/pagamento/conclusao agora representa
# UMA PARCELA, não necessariamente o fim do atendimento. O consumer
# soma ao valor_acumulado e só finaliza de fato quando bate o total.

import json
import logging
from decimal import Decimal

from django.utils import timezone
from django.db import transaction as db_transaction

from .mqtt_client import get_mqtt_client
from .mqtt_publisher import publicar_atendimento_limpo, publicar_alerta, publicar_falta_pagar
from .models import AtendimentoAtivo, ParcelaPagamento

logger = logging.getLogger("iot.consumer")

TOPICO_SERVICO_INICIO = "confia/servico/inicio"
TOPICO_PAGAMENTO_CONCLUSAO = "confia/pagamento/conclusao"  # agora = "parcela"
TOPICO_SERVICO_CANCELAR = "confia/servico/cancelar"

def _buscar_contexto_ativo(empreendedor_id: int):
    return AtendimentoAtivo.objects.filter(
        empreendedor_id=empreendedor_id, is_ativo=True
    ).first()


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Consumer MQTT conectado ao broker.")
        client.subscribe(TOPICO_SERVICO_INICIO, qos=1)
        client.subscribe(TOPICO_PAGAMENTO_CONCLUSAO, qos=1)
        client.subscribe(TOPICO_SERVICO_CANCELAR, qos=1)
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
            _processar_parcela_pagamento(payload)  # RENOMEADO conceitualmente
        elif topico == TOPICO_SERVICO_CANCELAR:
            _processar_cancelamento(payload)
    except Exception as e:
        logger.exception(f"Erro ao processar mensagem do tópico {topico}")
        # Apenas logamos o erro, não enviamos alerta pois não sabemos de quem é sem fazer parse seguro
        pass

def _processar_inicio_servico(payload: dict):
    emp_id = payload.get("empreendedor_id", 1)
    contexto = _buscar_contexto_ativo(emp_id)

    if not contexto:
        logger.warning("Inicio recebido sem AtendimentoAtivo definido!")
        publicar_alerta(emp_id, "Selecione um cliente")
        return

    if contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "CONFIRMADO"
        agendamento.save(update_fields=["status"])
        logger.info(f"Agendamento {agendamento.id} → CONFIRMADO")


def _processar_parcela_pagamento(payload: dict):
    """
    Payload esperado do ESP32 (agora representa UMA PARCELA):
    {
        "forma": "PIX" | "CARTAO" | "DINHEIRO" | "FIADO",
        "valor": 60.00,
        "duracao_segundos": 1820,   // só relevante na ÚLTIMA parcela
        "status_pagamento": "PAGO" | "PENDENTE"
    }
    """
    from financeiro.models import Pagamento, Transacao

    emp_id = payload.get("empreendedor_id", 1)
    contexto = _buscar_contexto_ativo(emp_id)

    if not contexto:
        logger.warning("Pagamento recebido sem AtendimentoAtivo definido!")
        publicar_alerta(emp_id, "Contexto perdido")
        return

    forma = payload.get("forma")
    valor_parcela = Decimal(str(payload.get("valor", 0.0)))
    duracao_segundos = payload.get("duracao_segundos", 0)
    status_pagamento = payload.get("status_pagamento", "PAGO")

    # REGRA DE NEGÓCIO: Clientes avulsos não podem ter opção de Fiado
    if forma == "FIADO":
        if not contexto.agendamento or not contexto.agendamento.cliente:
            logger.warning(f"Tentativa de FIADO bloqueada para cliente avulso: {emp_id}")
            publicar_alerta(emp_id, "Erro: Cliente Avulso (Sem Fiado)")
            # Emite evento de 'falta pagar' para forçar o painel a pedir outra forma de pagamento
            restante = contexto.valor_total_esperado - float(contexto.valor_acumulado) if contexto.valor_total_esperado else 0
            publicar_falta_pagar(emp_id, restante)
            return

    with db_transaction.atomic():
        # 1) Atualiza o acumulado do contexto
        contexto.valor_acumulado = Decimal(str(contexto.valor_acumulado)) + valor_parcela
        contexto.save(update_fields=["valor_acumulado"])

        # 2) Garante que existe uma Transacao "em aberto"
        # CORREÇÃO APLICADA: status_pagamento movido para defaults, usuario_id removido
        transacao, criada = Transacao.objects.get_or_create(
            agendamento=contexto.agendamento,
            defaults={
                "valor_total": contexto.valor_total_esperado or valor_parcela,
                "status_pagamento": "EM_ABERTO", 
            },
        )

        # 3) Registra esta parcela na tabela do IoT
        ParcelaPagamento.objects.create(
            transacao=transacao,
            forma_pagamento=forma,
            valor=valor_parcela,
        )

        # 4) Registra o pagamento na tabela financeira principal
        Pagamento.objects.create(
            transacao=transacao,
            valor=valor_parcela if status_pagamento == "PAGO" else 0,
            forma_pagamento=forma,
            observacao="Parcela registrada via Painel de Bancada IoT",
        )

        logger.info(
            f"Parcela registrada: {forma} R$ {valor_parcela} — "
            f"acumulado R$ {contexto.valor_acumulado} de "
            f"R$ {contexto.valor_total_esperado or 'modo livre'}"
        )

        # ─── Decisão: finaliza ou continua aguardando? ───
        deve_finalizar = (
            contexto.valor_total_esperado is None  # modo livre: 1 parcela = fim
            or contexto.esta_completo               # bateu o total
        )

        if deve_finalizar:
            _finalizar_atendimento(contexto, transacao, duracao_segundos, status_pagamento)
        else:
            # Ainda falta pagar — mantém o painel "aguardando mais parcelas"
            restante = contexto.valor_restante
            publicar_falta_pagar(emp_id, restante)
            logger.info(f"Aguardando mais parcelas — falta R$ {restante}")


def _finalizar_atendimento(contexto, transacao, duracao_segundos, ultimo_status_pagamento):
    """
    Encerra de fato o atendimento: conclui o agendamento, marca a
    Transacao como paga (ou pendente, se a ÚLTIMA parcela foi fiado)
    e libera o painel para o próximo cliente.
    """
    agendamento = contexto.agendamento

    if agendamento:
        agendamento.status = "CONCLUIDO"
        agendamento.hora_fim_real = timezone.now()
        agendamento.duracao_real_segundos = duracao_segundos
        agendamento.save(update_fields=["status", "hora_fim_real", "duracao_real_segundos"])

    transacao.status_pagamento = ultimo_status_pagamento  # PAGO ou PENDENTE
    transacao.valor_total = contexto.valor_acumulado  # ajusta ao que foi de fato pago
    transacao.save(update_fields=["status_pagamento", "valor_total"])

    contexto.is_ativo = False
    contexto.finalizado_em = timezone.now()
    contexto.save(update_fields=["is_ativo", "finalizado_em"])

    publicar_atendimento_limpo(contexto.empreendedor_id)

    logger.info(
        f"Atendimento finalizado: {contexto.nome_cliente_exibicao} — "
        f"total R$ {contexto.valor_acumulado} em "
        f"{transacao.parcelas.count()} parcela(s)"
    )


def _processar_cancelamento(payload: dict):
    emp_id = payload.get("empreendedor_id", 1)
    contexto = _buscar_contexto_ativo(emp_id)

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

    logger.info("Consumer do Painel de Bancada IoT iniciado (com pagamento dividido).")