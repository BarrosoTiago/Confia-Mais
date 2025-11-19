from django.urls import path, include
from rest_framework.routers import DefaultRouter
from agendamentos.views import AgendamentoViewSet
from servicos.views import ServicoViewSet
from financeiro.views import TransacaoViewSet, DespesaViewSet, CalculadoraViewSet
# Importe as views de autenticação
from .views import CustomLoginView, UserRegistrationView

router = DefaultRouter()
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'financeiro/transacoes', TransacaoViewSet, basename='transacao')
router.register(r'financeiro/despesas', DespesaViewSet, basename='despesa')
router.register(r'financeiro/calculadora', CalculadoraViewSet, basename='calculadora')

urlpatterns = [
    # --- ROTAS DE AUTENTICAÇÃO (O QUE ESTAVA FALTANDO) ---
    # Atenção: Adicionei o prefixo 'auth/' para ficar organizado
    path('auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    
    # --- ROTAS DA API (ROUTER) ---
    path('', include(router.urls)),
]