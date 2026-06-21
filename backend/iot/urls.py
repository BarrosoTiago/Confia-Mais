from django.urls import path
from .views import (
    SelecionarAtendimentoAtivoView,
    CancelarAtendimentoAtivoView,
    AtendimentoAtivoAtualView
)

urlpatterns = [
    # Rota para selecionar um atendimento (POST)
    path('atendimento-ativo/', SelecionarAtendimentoAtivoView.as_view(), name='selecionar-atendimento'),
    
    # Rota para buscar o atendimento que está rolando agora (GET)
    path('atendimento-ativo/atual/', AtendimentoAtivoAtualView.as_view(), name='atendimento-atual'),
    
    # Rota para cancelar o atendimento atual (DELETE)
    path('atendimento-ativo/cancelar/', CancelarAtendimentoAtivoView.as_view(), name='cancelar-atendimento'),
]