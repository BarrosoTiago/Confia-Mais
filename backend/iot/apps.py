# iot/apps.py
#
# Garante que o consumer MQTT comece a escutar tópicos assim que
# o Django finalizar o startup — sem precisar de um comando manual.

import os
from django.apps import AppConfig


class IotConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "iot"

    def ready(self):
        # Evita iniciar o consumer duas vezes quando o Django usa
        # o autoreloader em modo de desenvolvimento (runserver).
        if os.environ.get("RUN_MAIN") != "true" and not os.environ.get("IS_GUNICORN"):
            return

        from .mqtt_consumer import iniciar_consumer
        try:
            iniciar_consumer()
        except Exception as e:
            # Não derruba o servidor Django se o broker estiver
            # temporariamente fora — apenas loga o erro.
            import logging
            logging.getLogger("iot.consumer").error(
                f"Não foi possível iniciar o consumer MQTT: {e}"
            )