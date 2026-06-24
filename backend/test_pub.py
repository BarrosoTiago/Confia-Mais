import paho.mqtt.client as mqtt
import ssl
import time

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

client = mqtt.Client(client_id="teste-agente-004")
client.username_pw_set('esp32-painek', 'Confia05*')

context = ssl.create_default_context()
client.tls_set_context(context)

print("Connecting...")
client.connect("c7a51f5e5b0142c999d2b47cc1f0bf6d.s1.eu.hivemq.cloud", 8883, 60)
client.loop_start()
time.sleep(2)
client.loop_stop()
