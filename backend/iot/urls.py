# iot/urls.py

from django.urls import path
from .views import (
    SelecionarAtendimentoAtivoView,
    CancelarAtendimentoAtivoView,
    AtendimentoAtivoAtualView,
)

urlpatterns = [
    path(
        "atendimento-ativo/",
        SelecionarAtendimentoAtivoView.as_view(),
        name="selecionar-atendimento-ativo",
    ),
]

# Nota: GET, POST e DELETE no mesmo path "/atendimento-ativo/" podem ser
# resolvidos com uma única view (APIView) que implementa get/post/delete,
# ou três views separadas como acima — registre conforme a convenção
# já usada no restante do projeto Confia+.