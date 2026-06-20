# iot/mqtt_publisher.py
#
# Funções para o Django PUBLICAR mensagens nos tópicos que o ESP32 assina.
# Usa o mesmo cliente MQTT singleton definido em mqtt_client.py

import json
from .mqtt_client import get_mqtt_client

TOPICO_DISPLAY_STATUS = "confia/display/status"
TOPICO_DISPLAY_ALERTA = "confia/display/alerta"
TOPICO_ATENDIMENTO_ATIVO = "confia/painel/atendimento_ativo"


def publicar_atendimento_ativo(empreendedor_id: int, nome_cliente: str, contexto_id: int):
    """
    Publica qual cliente está selecionado para o painel físico exibir.
    O ESP32 assina este tópico e mostra o nome no LCD, liberando
    o início do atendimento pelo teclado.
    """
    client = get_mqtt_client()
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": nome_cliente,
        "contexto_id": contexto_id,
    })
    client.publish(TOPICO_ATENDIMENTO_ATIVO, payload, qos=1, retain=True)
    # retain=True é importante: se o ESP32 reiniciar ou reconectar,
    # ele recebe imediatamente o último estado conhecido.


def publicar_atendimento_limpo(empreendedor_id: int):
    """
    Publica payload vazio para o tópico de atendimento ativo,
    sinalizando ao ESP32 que não há mais cliente selecionado
    (volta para "CONFIA+ PRONTO — selecione no app").
    """
    client = get_mqtt_client()
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": None,
        "contexto_id": None,
    })
    client.publish(TOPICO_ATENDIMENTO_ATIVO, payload, qos=1, retain=True)


def publicar_proximo_agendamento(empreendedor_id: int, texto: str):
    """
    Publica o texto do próximo agendamento da fila (ex: "Maria 15:30")
    para ser exibido na tela LIVRE quando não há contexto ativo definido.
    """
    client = get_mqtt_client()
    client.publish(TOPICO_DISPLAY_STATUS, texto, qos=1, retain=True)


def publicar_alerta(empreendedor_id: int, mensagem: str):
    """
    Publica um alerta genérico para ser exibido no LCD com 3 bipes.
    """
    client = get_mqtt_client()
    client.publish(TOPICO_DISPLAY_ALERTA, mensagem, qos=1)