# iot/urls.py

from django.urls import path
from .views import (
    SelecionarAtendimentoAtivoView,
    CancelarAtendimentoAtivoView,
    AtendimentoAtivoAtualView,
)

urlpatterns = [
    # Aceita POST (App manda o cliente para a bancada)
    path(
        "atendimento-ativo/",
        SelecionarAtendimentoAtivoView.as_view(),
        name="selecionar-atendimento-ativo",
    ),
    
    # Aceita GET (App consulta quem está na bancada agora)
    path(
        "atendimento-ativo/status/",
        AtendimentoAtivoAtualView.as_view(),
        name="status-atendimento-ativo",
    ),
    
    # Aceita DELETE (App cancela a seleção e limpa a bancada)
    path(
        "atendimento-ativo/cancelar/",
        CancelarAtendimentoAtivoView.as_view(),
        name="cancelar-atendimento-ativo",
    ),
]