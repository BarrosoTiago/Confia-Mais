import os
from django.apps import AppConfig


class IotConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "iot"

    def ready(self):
        # Evita duplo início no autoreloader do runserver local
        # No Render (Uvicorn/Gunicorn) sempre inicia normalmente
        is_dev_reloader = os.environ.get("RUN_MAIN") == "true"
        is_prod         = os.environ.get("IS_GUNICORN") or os.environ.get("RENDER")

        if not is_dev_reloader and not is_prod:
            return

        from .mqtt_consumer import iniciar_consumer
        try:
            iniciar_consumer()
        except Exception as e:
            import logging
            logging.getLogger("iot.consumer").error(
                f"Não foi possível iniciar o consumer MQTT: {e}"
            )