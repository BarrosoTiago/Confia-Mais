import paho.mqtt.client as mqtt
import ssl

# Configurações do Broker EMQX (Público e sem bloqueios)
MQTT_BROKER = "broker.emqx.io"
MQTT_PORT = 1883
MQTT_USER = "" 
MQTT_PASS = ""

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
        print("-" * 50)
        if payload == '{"action": "limpar"}':
            print("🖥️  [ ESP32 ] TELA: PAINEL LIMPO / MODO STANDBY")
        elif "Selecao cancelada" in payload:
            print("🛑  [ ESP32 ] AÇÃO: PAINEL BLOQUEADO / CANCELADO")
        else:
            import json
            try:
                dados = json.loads(payload)
                print(f"🔓  [ ESP32 ] AÇÃO: PAINEL DESBLOQUEADO COM SUCESSO!")
                print(f"👤  Cliente na bancada: {dados.get('nome_cliente', 'Walk-in')}")
                print(f"💰  Valor do Serviço: R$ {dados.get('valor_total', 0.0)}")
            except:
                print(f"🖥️  [ ESP32 ] DADOS RECEBIDOS: {payload}")
        print("-" * 50 + "\n")
    except Exception as e:
        print(f"Erro ao processar mensagem: {e}")

# Configuração do Cliente MQTT
client = mqtt.Client(client_id="simulador-esp32", protocol=mqtt.MQTTv311)
if MQTT_USER:
    client.username_pw_set(MQTT_USER, MQTT_PASS)

# Configuração de TLS apenas se usar 8883
if MQTT_PORT == 8883:
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
