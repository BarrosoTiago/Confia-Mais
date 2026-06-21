# iot/urls.py

from django.urls import path
from .views import AtendimentoAtivoView

urlpatterns = [
    # Aceita GET, POST, DELETE (App manda o cliente para a bancada, consulta e cancela)
    path(
        "atendimento-ativo/",
        AtendimentoAtivoView.as_view(),
        name="atendimento-ativo",
    ),
]