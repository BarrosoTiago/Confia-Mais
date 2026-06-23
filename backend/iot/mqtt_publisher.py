# iot/mqtt_publisher.py

import json
import logging
from .mqtt_client import get_mqtt_client

logger = logging.getLogger(__name__)

TOPICO_DISPLAY_STATUS    = "confia/display/status"
TOPICO_DISPLAY_ALERTA    = "confia/display/alerta"
TOPICO_ATENDIMENTO_ATIVO = "confia/painel/atendimento_ativo"
TOPICO_FALTA_PAGAR       = "confia/painel/falta_pagar"


import paho.mqtt.publish as mqtt_publish
from .mqtt_client import MQTT_BROKER, MQTT_PORT, MQTT_USER, MQTT_PASS, MQTT_CLIENT_ID
import os
import uuid
import ssl

def _publicar(topico: str, payload: str, qos: int = 1, retain: bool = False):
    try:
        logger.info(f"[MQTT] Iniciando publicação síncrona em '{topico}': {payload}")
        
        # ID exclusivo para essa exata requisição HTTP
        client_id_temp = f"{MQTT_CLIENT_ID}-pub-{os.getpid()}-{uuid.uuid4().hex[:4]}"
        
        auth = {'username': MQTT_USER, 'password': MQTT_PASS}
        
        # O Paho fará tudo sozinho: Conectar, Autenticar, Enviar, Esperar ACK e Desconectar.
        # Sem threads em background, sem sockets zumbis!
        mqtt_publish.single(
            topic=topico,
            payload=payload,
            qos=qos,
            retain=retain,
            hostname=MQTT_BROKER,
            port=MQTT_PORT,
            client_id=client_id_temp,
            auth=auth,
            # No Python (diferente do ESP32) não precisamos desativar certificados Let's Encrypt
            tls={'tls_version': ssl.PROTOCOL_TLS},
            protocol=mqtt.MQTTv311
        )
        logger.info(f"[MQTT] SUCESSO ABSOLUTO! Mensagem '{topico}' entregue ao HiveMQ.")
        
    except Exception as e:
        logger.error(f"[MQTT] Falha catastrófica ao publicar síncrono em '{topico}': {e}", exc_info=True)


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