import json
import logging
from .mqtt_client import get_mqtt_client

logger = logging.getLogger(__name__)

TOPICO_ATENDIMENTO_ATIVO = "confia/painel/atendimento_ativo"
TOPICO_DISPLAY_STATUS    = "confia/display/status"
TOPICO_DISPLAY_ALERTA    = "confia/display/alerta"


def _publicar(topico: str, payload: str, qos: int = 1, retain: bool = False):
    try:
        client = get_mqtt_client()

        # ← NOVO: loga antes de publicar
        logger.info(f"[MQTT] Publicando em '{topico}' (retain={retain}): {payload}")

        result = client.publish(topico, payload, qos=qos, retain=retain)

        # ← NOVO: loga o resultado imediato
        logger.info(f"[MQTT] Resultado publish '{topico}': rc={result.rc}, mid={result.mid}")

        if result.rc != 0:
            logger.warning(f"[MQTT] Publish falhou em '{topico}': rc={result.rc}")

    except Exception as e:
        logger.error(f"[MQTT] Erro ao publicar em '{topico}': {e}", exc_info=True)


def publicar_atendimento_ativo(empreendedor_id: int, nome_cliente: str, contexto_id: int, valor_total: float = 0.0):
    nome_formatado = nome_cliente[:16] if nome_cliente else ""
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": nome_formatado,
        "contexto_id": contexto_id,
        "valor_total": float(valor_total),
    })
    _publicar(TOPICO_ATENDIMENTO_ATIVO, payload, retain=True)


def publicar_atendimento_limpo(empreendedor_id: int):
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": None,
        "contexto_id": None,
        "valor_total": 0.0,
    })
    _publicar(TOPICO_ATENDIMENTO_ATIVO, payload, retain=True)


def publicar_proximo_agendamento(empreendedor_id: int, texto: str):
    _publicar(TOPICO_DISPLAY_STATUS, texto, retain=True)


def publicar_alerta(empreendedor_id: int, mensagem: str):
    _publicar(TOPICO_DISPLAY_ALERTA, mensagem)