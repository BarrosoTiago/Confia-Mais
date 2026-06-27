import os
import ssl
import logging
import uuid
import paho.mqtt.client as mqtt

logger = logging.getLogger(__name__)

MQTT_BROKER    = os.environ.get("MQTT_BROKER", "c7a51f5e5b0142c999d2b47cc1f0bf6d.s1.eu.hivemq.cloud")
MQTT_PORT      = int(os.environ.get("MQTT_PORT", 8883))
MQTT_USER      = os.environ.get("MQTT_USER", "esp32-painek")
MQTT_PASS      = os.environ.get("MQTT_PASS", "Confia05*")
MQTT_CLIENT_ID = os.environ.get("MQTT_CLIENT_ID", "confia-django")

_client_instance = None


def _criar_cliente() -> mqtt.Client:
    # Gera um ID 100% único por conexão usando o PID real do worker + um código aleatório.
    # Isso evita que os múltiplos trabalhadores do Render (Gunicorn) derrubem uns aos outros (rc=7).
    client_id_unico = f"{MQTT_CLIENT_ID}-{os.getpid()}-{uuid.uuid4().hex[:6]}"
    
    client = mqtt.Client(client_id=client_id_unico, protocol=mqtt.MQTTv311)
    client.username_pw_set(MQTT_USER, MQTT_PASS) if MQTT_USER else None
    
    if MQTT_PORT == 8883:
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)

    client.on_disconnect = lambda c, userdata, rc: (
        logger.warning(f"MQTT desconectado (rc={rc}). Reconectará automaticamente.")
    )

    # ← NOVO: loga cada publish confirmado pelo broker
    client.on_publish = lambda c, userdata, mid: (
        logger.info(f"MQTT publish confirmado pelo broker (mid={mid})")
    )

    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)

    for _ in range(50):
        client.loop(timeout=0.1)
        if client.is_connected():
            break
    else:
        raise ConnectionError("Timeout ao conectar no broker MQTT após 5s")

    client.loop_start()
    logger.info(f"MQTT conectado: {MQTT_BROKER}:{MQTT_PORT} (client_id={MQTT_CLIENT_ID})")
    return client


def get_mqtt_client() -> mqtt.Client:
    global _client_instance

    if _client_instance is not None and _client_instance.is_connected():
        return _client_instance

    logger.info("MQTT: criando nova conexão...")
    _client_instance = _criar_cliente()
    return _client_instance