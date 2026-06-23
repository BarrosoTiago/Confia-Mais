# iot/mqtt_publisher.py

import json
import logging
from .mqtt_client import get_mqtt_client

logger = logging.getLogger(__name__)

TOPICO_DISPLAY_STATUS    = "confia/display/status"
TOPICO_DISPLAY_ALERTA    = "confia/display/alerta"
TOPICO_ATENDIMENTO_ATIVO = "confia/painel/atendimento_ativo"
TOPICO_FALTA_PAGAR       = "confia/painel/falta_pagar"


def _publicar(topico: str, payload: str, qos: int = 1, retain: bool = False):
    try:
        client = get_mqtt_client()
        logger.info(f"[MQTT] Publicando em '{topico}' (retain={retain}): {payload}")
        result = client.publish(topico, payload, qos=qos, retain=retain)
        
        # O pulo do gato: forçar o Django a esperar o "OK" do servidor HiveMQ (até 3 segundos)
        # Se a conexão TCP estava zumbi ou morta, isso vai falhar ou dar timeout!
        try:
            result.wait_for_publish(timeout=3.0)
            if result.is_published():
                logger.info(f"[MQTT] SUCESSO ABSOLUTO! Mensagem '{topico}' entregue e confirmada (mid={result.mid})")
            else:
                logger.error(f"[MQTT] ERRO: Timeout. A mensagem não chegou no HiveMQ!")
        except Exception as err_wait:
            logger.error(f"[MQTT] ERRO GRAVE de rede ao esperar confirmação: {err_wait}")
            
    except Exception as e:
        logger.error(f"[MQTT] Erro ao instanciar ou publicar em '{topico}': {e}", exc_info=True)


def publicar_atendimento_ativo(
    empreendedor_id: int,
    nome_cliente: str,
    contexto_id: int,
    valor_total_esperado: float = None,
):
    nome_formatado = nome_cliente[:16] if nome_cliente else ""
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": nome_formatado,
        "contexto_id": contexto_id,
        "valor_total": float(valor_total_esperado) if valor_total_esperado else 0.0,
    })
    _publicar(TOPICO_ATENDIMENTO_ATIVO, payload, retain=False)  # ← False por enquanto


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


def publicar_falta_pagar(empreendedor_id: int, valor_restante: float):
    payload = json.dumps({"valor_restante": valor_restante})
    _publicar(TOPICO_FALTA_PAGAR, payload)