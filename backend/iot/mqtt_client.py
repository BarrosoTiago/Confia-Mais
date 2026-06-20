# iot/mqtt_client.py
#
# Cliente MQTT único, compartilhado por todo o processo Django.
# Tanto o publisher (views.py chamando) quanto o consumer (que assina
# os tópicos do ESP32) usam esta mesma conexão.

import os
import ssl
import paho.mqtt.client as mqtt

MQTT_BROKER = os.environ.get("MQTT_BROKER", "c7a51f5e5b0142c999d2b47cc1f0bf6d.s1.eu.hivemq.cloud")
MQTT_PORT = int(os.environ.get("MQTT_PORT", 8883))
MQTT_USER = os.environ.get("MQTT_USER", "esp32-painek")
MQTT_PASS = os.environ.get("MQTT_PASS", "Confia05*")
MQTT_CLIENT_ID = os.environ.get("MQTT_CLIENT_ID", "confia-django-backend")

_client_instance = None


def get_mqtt_client() -> mqtt.Client:
    """
    Retorna o cliente MQTT singleton, conectando se ainda não estiver.
    Usado tanto pelo publisher quanto pelo consumer para compartilhar
    a mesma conexão TCP/TLS com o broker.
    """
    global _client_instance

    if _client_instance is not None and _client_instance.is_connected():
        return _client_instance

    client = mqtt.Client(client_id=MQTT_CLIENT_ID, protocol=mqtt.MQTTv311)
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.tls_set(cert_reqs=ssl.CERT_NONE)  # simplificado p/ protótipo
    client.tls_insecure_set(True)

    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_start()  # thread própria do paho para manter a conexão viva

    _client_instance = client
    return _client_instance