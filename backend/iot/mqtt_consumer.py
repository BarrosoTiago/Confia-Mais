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

# Fallback caso o payload não envie empreendedor_id
EMPREENDEDOR_ID_FALLBACK = 1

FORMA_MAP = {
    "PIX":      "PIX",
    "DINHEIRO": "DINHEIRO",
    "CARTAO":   "CARTAO_CREDITO",
    "FIADO":    "FIADO",
}


def _buscar_contexto_ativo(empreendedor_id: int = None) -> AtendimentoAtivo | None:
    qs = AtendimentoAtivo.objects.filter(is_ativo=True)
    
    # Se temos o ID e existe um registro para este ID
    if empreendedor_id and qs.filter(empreendedor_id=empreendedor_id).exists():
        return qs.filter(empreendedor_id=empreendedor_id).first()
        
    # Fallback: Se não achou pelo ID ou não veio ID, pega o único ativo globalmente
    # Isso resolve o problema de o ESP32 não enviar o ID correto.
    return qs.first()


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
        empreendedor_id = payload.get("empreendedor_id", EMPREENDEDOR_ID_FALLBACK)
        publicar_alerta(empreendedor_id, "Erro no servidor")


def _processar_inicio_servico(payload: dict):
    empreendedor_id = payload.get("empreendedor_id", EMPREENDEDOR_ID_FALLBACK)
    contexto = _buscar_contexto_ativo(empreendedor_id)

    if not contexto:
        logger.warning(f"Inicio recebido sem AtendimentoAtivo para empreendedor_id={empreendedor_id}")
        publicar_alerta(empreendedor_id, "Selecione um cliente")
        return

    if contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "CONFIRMADO"
        agendamento.save(update_fields=["status"])
        logger.info(f"Agendamento {agendamento.id} → atendimento iniciado")
    else:
        logger.info(f"Walk-in iniciado: {contexto.nome_cliente_exibicao}")


def _processar_pagamento_concluido(payload: dict):
    from financeiro.models import Transacao, Pagamento

    empreendedor_id = payload.get("empreendedor_id", EMPREENDEDOR_ID_FALLBACK)
    contexto = _buscar_contexto_ativo(empreendedor_id)

    if not contexto:
        logger.warning(f"Pagamento recebido sem AtendimentoAtivo para empreendedor_id={empreendedor_id}")
        publicar_alerta(empreendedor_id, "Contexto perdido")
        return

    # Extrai a lista de pagamentos do payload
    pagamentos_raw = payload.get("pagamentos")
    
    # Fallback: Se o ESP32 enviar o formato antigo (apenas uma forma e valor), convertemos para lista
    if not pagamentos_raw:
        forma_unica = payload.get("forma", "DINHEIRO")
        valor_unico = float(payload.get("valor", 0.0))
        pagamentos_raw = [{"forma": forma_unica, "valor": valor_unico}]

    agendamento = contexto.agendamento

    if agendamento:
        # 1) Conclui o agendamento
        agendamento.status = "CONCLUIDO"
        agendamento.save(update_fields=["status"])

        # 2) Define o valor total da transação com base no serviço (ou na soma das parcelas se não houver serviço)
        if getattr(agendamento, 'servico', None) and agendamento.servico.preco:
            valor_total_esperado = float(agendamento.servico.preco)
        else:
            valor_total_esperado = sum(float(p.get("valor", 0.0)) for p in pagamentos_raw)

        # 3) Cria ou recupera a Transacao
        transacao, _ = Transacao.objects.get_or_create(
            agendamento=agendamento,
            defaults={"valor_total": valor_total_esperado, "status_pagamento": "PENDENTE"},
        )

        # 4) Registra os múltiplos Pagamentos percorrendo a lista
        for parcela in pagamentos_raw:
            forma_raw = parcela.get("forma", "DINHEIRO")
            forma     = FORMA_MAP.get(forma_raw, "DINHEIRO")
            valor_parcela = float(parcela.get("valor", 0.0))

            if forma == "FIADO":
                Pagamento.objects.create(
                    transacao=transacao,
                    valor=valor_parcela,
                    forma_pagamento="FIADO",
                    observacao="Fiado — registrado via Painel IoT",
                )
                logger.info(f"Fiado registrado: R$ {valor_parcela} — agendamento {agendamento.id}")
            else:
                Pagamento.objects.create(
                    transacao=transacao,
                    valor=valor_parcela,
                    forma_pagamento=forma,
                    observacao=f"Registrado via Painel IoT ({forma_raw})",
                )
                logger.info(f"Pagamento parcela salva: {forma} R$ {valor_parcela} — agendamento {agendamento.id}")

        # 5) Atualiza totais da transação com base no que foi efetivamente pago
        total_pago = transacao.pagamentos.exclude(forma_pagamento="FIADO").aggregate(
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
            f"Transação atualizada: Total Pago R$ {total_pago} "
            f"({transacao.status_pagamento}) — agendamento {agendamento.id}"
        )
    else:
        # Registro para clientes Walk-in (sem agendamento)
        resumo_walkin = ", ".join([f"{p.get('forma')} (R$ {p.get('valor')})" for p in pagamentos_raw])
        logger.info(
            f"Walk-in concluído: {contexto.nome_cliente_exibicao} "
            f"— Múltiplos pagamentos: {resumo_walkin}"
        )

    # 6) Libera o painel
    contexto.is_ativo = False
    contexto.finalizado_em = timezone.now()
    contexto.save(update_fields=["is_ativo", "finalizado_em"])
    publicar_atendimento_limpo(empreendedor_id)


def _processar_cancelamento(payload: dict):
    empreendedor_id = payload.get("empreendedor_id", EMPREENDEDOR_ID_FALLBACK)
    contexto = _buscar_contexto_ativo(empreendedor_id)

    if not contexto:
        logger.warning(f"Cancelamento recebido sem AtendimentoAtivo para empreendedor_id={empreendedor_id}")
        return

    if contexto.agendamento:
        agendamento = contexto.agendamento
        agendamento.status = "PENDENTE"
        agendamento.save(update_fields=["status"])
        logger.info(f"Agendamento {agendamento.id} revertido para PENDENTE")
    else:
        logger.info(f"Walk-in cancelado: {contexto.nome_cliente_exibicao}")


def iniciar_consumer():
    client = get_mqtt_client()
    client.on_connect = _on_connect
    client.on_message = _on_message

    if client.is_connected():
        _on_connect(client, None, None, 0)

    logger.info("Consumer do Painel de Bancada IoT iniciado.")