# iot/apps.py — CORRIGIDO
#
# Problema original: a condição bloqueava o consumer em desenvolvimento.
# No runserver local, o processo principal NÃO seta RUN_MAIN —
# o Django só seta RUN_MAIN="true" no processo FILHO (reloader).
# Então a condição anterior nunca deixava o consumer subir localmente.
#
# Solução: inverter a lógica — bloqueia apenas o processo filho
# do reloader (RUN_MAIN="true"), deixa passar em todos os outros casos.

import os
from django.apps import AppConfig


class IotConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "iot"

    def ready(self):
        # RUN_MAIN="true" = processo filho do autoreloader do Django
        # (o filho apenas recarrega o código, o pai já iniciou o consumer)
        # Em todos os outros casos (processo principal local, Gunicorn,
        # Render, Uvicorn) — deixa o consumer subir normalmente.
        if os.environ.get("RUN_MAIN") == "true":
            return

        from .mqtt_consumer import iniciar_consumer
        try:
            iniciar_consumer()
        except Exception as e:
            import logging
            logging.getLogger("iot.consumer").error(
                f"Não foi possível iniciar o consumer MQTT: {e}"
            )