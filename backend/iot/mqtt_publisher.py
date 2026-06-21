# iot/mqtt_publisher.py — ATUALIZADO para pagamento dividido
#
# Mudança principal: publicar_atendimento_ativo agora também envia
# o valor_total esperado do serviço, para o ESP32 calcular o
# "Falta R$ X" automaticamente durante parcelas.

import json
from .mqtt_client import get_mqtt_client

TOPICO_DISPLAY_STATUS = "confia/display/status"
TOPICO_DISPLAY_ALERTA = "confia/display/alerta"
TOPICO_ATENDIMENTO_ATIVO = "confia/painel/atendimento_ativo"


def publicar_atendimento_ativo(
    empreendedor_id: int,
    nome_cliente: str,
    contexto_id: int,
    valor_total_esperado: float = None,  # NOVO
):
    """
    Publica qual cliente está selecionado, incluindo o valor total
    esperado do serviço (se houver um agendamento com preço definido).

    Se valor_total_esperado for None (ex: walk-in sem preço definido),
    o ESP32 opera no modo antigo: profissional digita 1 valor, confirma
    com 1 tecla, finaliza imediatamente — sem suporte a parcelas.
    """
    client = get_mqtt_client()
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": nome_cliente,
        "contexto_id": contexto_id,
        "valor_total_esperado": valor_total_esperado,  # NOVO — pode ser null
    })
    client.publish(TOPICO_ATENDIMENTO_ATIVO, payload, qos=1, retain=True)


def publicar_atendimento_limpo(empreendedor_id: int):
    client = get_mqtt_client()
    payload = json.dumps({
        "empreendedor_id": empreendedor_id,
        "nome_cliente": None,
        "contexto_id": None,
        "valor_total_esperado": None,
    })
    client.publish(TOPICO_ATENDIMENTO_ATIVO, payload, qos=1, retain=True)


def publicar_proximo_agendamento(empreendedor_id: int, texto: str):
    client = get_mqtt_client()
    client.publish(TOPICO_DISPLAY_STATUS, texto, qos=1, retain=True)


def publicar_alerta(empreendedor_id: int, mensagem: str):
    client = get_mqtt_client()
    client.publish(TOPICO_DISPLAY_ALERTA, mensagem, qos=1)


def publicar_falta_pagar(empreendedor_id: int, valor_restante: float):
    """
    NOVO: publica quanto ainda falta pagar após uma parcela parcial.
    O ESP32 assina isso para atualizar a tela "Falta R$ X" e permanecer
    no estado de aguardar mais parcelas em vez de finalizar.
    """
    client = get_mqtt_client()
    payload = json.dumps({"valor_restante": valor_restante})
    client.publish("confia/painel/falta_pagar", payload, qos=1)