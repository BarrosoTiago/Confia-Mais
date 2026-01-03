from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import das Views
from agendamentos.views import (
    AgendamentoViewSet, 
    HorarioViewSet, 
    HorarioDisponivelView, 
    AvaliarAgendamentoView,
    AvaliacoesLojaView,
    FinanceiroDashboardView,
    DespesaViewSet, # <--- IMPORTANTE: Importar a View de Despesas
    PagamentoViewSet
)

from servicos.views import ServicoViewSet, CategoriaViewSet
from .views import (
    UserRegistrationView, 
    CustomLoginView, 
    UserMeView, 
    LogoutView, 
    ClienteListView, 
    EmpreendedorListView
)

router = DefaultRouter()
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'horarios', HorarioViewSet, basename='horario')
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'despesas', DespesaViewSet, basename='despesa') # <--- Rota /api/despesas/
router.register(r'pagamentos', PagamentoViewSet, basename='pagamento')

urlpatterns = [
    # --- ROTAS ESPECÍFICAS ---
    path('financeiro/transacoes/dashboard/', FinanceiroDashboardView.as_view(), name='financeiro_dashboard'),
    path('horarios/disponiveis/', HorarioDisponivelView.as_view(), name='horarios_disponiveis'),
    path('agendamentos/<int:pk>/avaliar/', AvaliarAgendamentoView.as_view(), name='avaliar_agendamento'),
    path('avaliacoes/loja/<int:empreendedor_id>/', AvaliacoesLojaView.as_view(), name='loja_avaliacoes'),
    
    # --- AUTENTICAÇÃO ---
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/users/me/', UserMeView.as_view(), name='user_me'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/clientes/', ClienteListView.as_view(), name='clientes_list'),
    path('auth/empreendedores/', EmpreendedorListView.as_view(), name='empreendedores_list'),

    # --- ROTAS PADRÃO (CRUD) ---
    path('', include(router.urls)),
]