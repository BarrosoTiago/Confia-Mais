from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importe as views dos seus apps
from agendamentos.views import AgendamentoViewSet, HorarioViewSet, HorarioDisponivelView # <--- ADICIONE HorarioViewSet AQUI
from servicos.views import ServicoViewSet
from financeiro.views import TransacaoViewSet, DespesaViewSet, CalculadoraViewSet, PagamentoViewSet
from .views import CustomLoginView, UserRegistrationView, ClienteListView

router = DefaultRouter()

# Rotas existentes...
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'financeiro/transacoes', TransacaoViewSet, basename='transacao')
router.register(r'financeiro/despesas', DespesaViewSet, basename='despesa')
router.register(r'financeiro/calculadora', CalculadoraViewSet, basename='calculadora')
router.register(r'financeiro/pagamentos', PagamentoViewSet, basename='pagamento')

# --- NOVA ROTA DE HORÁRIOS ---
router.register(r'config/horarios', HorarioViewSet, basename='horario') # <--- ADICIONE ESTA LINHA

urlpatterns = [
    path('auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/clientes/', ClienteListView.as_view(), name='lista-clientes'),
    path('horarios/disponiveis/', HorarioDisponivelView.as_view(), name='horarios-publicos'),
    
    path('', include(router.urls)),
]