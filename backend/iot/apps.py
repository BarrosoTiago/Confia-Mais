import os
import logging
from django.apps import AppConfig
from django.conf import settings  # Importação necessária para ler o DEBUG

class IotConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "iot"

    def ready(self):
        # Evita duplo início no autoreloader do runserver local
        is_dev_reloader = os.environ.get("RUN_MAIN") == "true"
        is_prod         = os.environ.get("IS_GUNICORN") or os.environ.get("RENDER")

        if not is_dev_reloader and not is_prod:
            return

        # Se estiver em ambiente de desenvolvimento local (DEBUG=True)
        # e a rede estiver bloqueada, o aviso não trava o app.
        try:
            from .mqtt_consumer import iniciar_consumer
            iniciar_consumer()
        except Exception as e:
            logger = logging.getLogger("iot.consumer")
            if settings.DEBUG:
                # Transforma o ERRO crítico em apenas um AVISO no terminal local
                logger.warning(
                    f"⚠️ [Aviso Local] Não foi possível iniciar o MQTT (Rede provavelmente bloqueada): {e}"
                )
            else:
                # Em produção na Render, mantém como erro crítico para monitoramento
                logger.error(f"Não foi possível iniciar o consumer MQTT em Produção: {e}")