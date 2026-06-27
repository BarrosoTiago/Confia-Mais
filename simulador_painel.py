import paho.mqtt.client as mqtt
import ssl

# Configurações do Broker HiveMQ
MQTT_BROKER = "c7a51f5e5b0142c999d2b47cc1f0bf6d.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USER = "esp32-painek"  # ou esp32-painel
MQTT_PASS = "Confia05*"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ [ESP32 SIMULADOR] Conectado ao Broker MQTT com sucesso!")
        # Assina o tópico onde o backend publica as informações do painel
        client.subscribe("confia/#")
        print("📡 Aguardando comandos da API (via Celular ou Web)...\n")
    else:
        print(f"❌ Falha na conexão. Código de erro: {rc}")

def on_message(client, userdata, msg):
    print(f"[{msg.topic}] Nova mensagem recebida!")
    try:
        # A mensagem chega em bytes, vamos decodificar para string
        payload = msg.payload.decode('utf-8')
        
        # Limpar a tela (simulado com quebra de linhas)
        print("-" * 40)
        if payload == '{"action": "limpar"}':
            print("🖥️ TELA DO ESP32: [Painel Limpo / Standby]")
        else:
            print(f"🖥️ TELA DO ESP32: {payload}")
        print("-" * 40 + "\n")
    except Exception as e:
        print(f"Erro ao processar mensagem: {e}")

# Configuração do Cliente MQTT
client = mqtt.Client(client_id="simulador-esp32", protocol=mqtt.MQTTv311)
client.username_pw_set(MQTT_USER, MQTT_PASS)

# Configuração de TLS para HiveMQ Cloud
client.tls_set(cert_reqs=ssl.CERT_NONE)
client.tls_insecure_set(True)

client.on_connect = on_connect
client.on_message = on_message

try:
    print("Ligando o simulador do painel...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    # Fica em loop infinito escutando as mensagens
    client.loop_forever()
except KeyboardInterrupt:
    print("\nDesligando simulador...")
    client.disconnect()
