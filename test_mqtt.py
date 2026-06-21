import paho.mqtt.client as mqtt
import ssl

def test_conn(user, pwd):
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    client.username_pw_set(user, pwd)
    client.tls_set(cert_reqs=ssl.CERT_NONE)
    client.tls_insecure_set(True)
    
    try:
        client.connect("c7a51f5e5b0142c999d2b47cc1f0bf6d.s1.eu.hivemq.cloud", 8883, 5)
        client.loop_start()
        print(f"Success with user {user}")
        client.disconnect()
    except Exception as e:
        print(f"Failed with user {user}: {e}")

test_conn("esp32-painek", "Confia05*")
test_conn("esp32-painel", "Confia05*")
