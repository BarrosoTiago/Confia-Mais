import json
import logging
from .mqtt_client import get_mqtt_client

logger = logging.getLogger(__name__)

TOPICO_ATENDIMENTO_ATIVO = "confia/painel/atendimento_ativo"
TOPICO_DISPLAY_STATUS    = "confia/display/status"
TOPICO_DISPLAY_ALERTA    = "confia/display/alerta"


def _publicar(topico: str, payload: str, qos: int = 1, retain: bool = False):
    """Wrapper central com tratamento de erro — nunca deixa vazar exceção MQTT."""
    try:
        client = get_mqtt_client()
        result = client.publish(topico, payload, qos=qos, retain=retain)

        # Paho retorna (MQTT_ERR_SUCCESS=0, mid) — loga se falhou
        if result.rc != 0:
            logger.warning(f"MQTT publish falhou no tópico '{topico}': rc={result.rc}")

    except Exception as e:
        # Nunca deixa o MQTT derrubar o endpoint HTTP
        logger.error(f"Erro ao publicar no MQTT (tópico={topico}): {e}", exc_info=True)


def publicar_atendimento_ativo(empreendedor_id: int, nome_cliente: str, contexto_id: int, valor_total: float = 0.0):
    """
    Publica os dados do atendimento ativo, incluindo o valor total do serviço
    para que o ESP32 possa gerenciar pagamentos divididos.
    """
    # Garante que o nome não ultrapasse os 16 caracteres do display LCD
    nome_formatado = nome_cliente[:16] if nome_cliente else ""

    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": nome_formatado,
        "contexto_id": contexto_id,
        "valor_total": float(valor_total) # Incluído para o cálculo das parcelas no ESP32
    })
    _publicar(TOPICO_ATENDIMENTO_ATIVO, payload, retain=True)


def publicar_atendimento_limpo(empreendedor_id: int):
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": None,
        "contexto_id": None,
        "valor_total": 0.0
    })
    _publicar(TOPICO_ATENDIMENTO_ATIVO, payload, retain=True)


def publicar_proximo_agendamento(empreendedor_id: int, texto: str):
    _publicar(TOPICO_DISPLAY_STATUS, texto, retain=True)


def publicar_alerta(empreendedor_id: int, mensagem: str):
    _publicar(TOPICO_DISPLAY_ALERTA, mensagem)