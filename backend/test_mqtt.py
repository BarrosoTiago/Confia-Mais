import paho.mqtt.client as mqtt
import json, ssl, time

def on_connect(client, userdata, flags, rc):
    print("Conectado com rc=" + str(rc))
    payload = json.dumps({
        "empreendedor_id": 1,
        "nome_cliente": "TESTE LOCAL",
        "contexto_id": 99,
        "valor_total": 50.0,
    })
    client.publish("confia/painel/atendimento_ativo", payload, qos=1)
    print("Publicado!")

client = mqtt.Client()
client.username_pw_set("esp32-painek", "Confia05*")
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)
client.on_connect = on_connect

client.connect("c7a51f5e5b0142c999d2b47cc1f0bf6d.s1.eu.hivemq.cloud", 8883, 60)
client.loop_start()
time.sleep(3)
client.loop_stop()
client.disconnect()
print("Teste concluído")
