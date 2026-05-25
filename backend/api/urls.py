from django.urls import path, include
from rest_framework.routers import DefaultRouter

# --- 1. IMPORT DAS VIEWS DO APP FINANCEIRO (DINHEIRO REAL) ---
# Importamos daqui para garantir que os cálculos usem as tabelas Transacao e Pagamento
from financeiro.views import (
    FinanceiroDashboardView,
    TransacaoViewSet,
    PagamentoViewSet,
    DespesaViewSet,
    CalculadoraViewSet
)

# --- 2. IMPORT DAS VIEWS DE AGENDAMENTOS ---
from agendamentos.views import (
    AgendamentoViewSet, 
    HorarioViewSet, 
    HorarioDisponivelView, 
    AvaliarAgendamentoView, 
    AvaliacoesLojaView,
    AnotacaoViewSet
)

# --- 3. IMPORT DAS VIEWS DE SERVIÇOS ---
from servicos.views import CategoriaViewSet

# --- 4. IMPORT DAS VIEWS CENTRAIS (API/AUTH) ---
from .views import (
    UserRegistrationView, 
    CustomLoginView, 
    UserMeView, 
    DeleteAccountView, 
    LogoutView, 
    ClienteListView, 
    EmpreendedorListView, 
    ServicoViewSet, 
    HorarioConfigViewSet
)

router = DefaultRouter()

# Rotas de Negócio (Agendamentos)
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'horarios', HorarioViewSet, basename='horario')
router.register(r'anotacoes', AnotacaoViewSet, basename='anotacao')

# Rotas Financeiras (Agora apontando para o app financeiro)
router.register(r'financeiro/transacoes', TransacaoViewSet, basename='transacao')
router.register(r'pagamentos', PagamentoViewSet, basename='pagamento')
router.register(r'despesas', DespesaViewSet, basename='despesa')
router.register(r'calculadora', CalculadoraViewSet, basename='calculadora')

# Rotas de Serviços e Categorias
router.register(r'servicos', ServicoViewSet, basename='servico')
router.register(r'categorias', CategoriaViewSet, basename='categoria')

urlpatterns = [
    # --- FINANCEIRO & DASHBOARD (PONTO CRÍTICO) ---
    # Esta rota deve chamar a view do app financeiro para os cards saírem do R$ 0,00
    path('financeiro/transacoes/dashboard/', FinanceiroDashboardView.as_view(), name='financeiro_dashboard'),
    
    path('horarios/disponiveis/', HorarioDisponivelView.as_view(), name='horarios_disponiveis'),
    
    # --- AVALIAÇÕES ---
    path('agendamentos/<int:pk>/avaliar/', AvaliarAgendamentoView.as_view(), name='avaliar_agendamento'),
    path('avaliacoes/loja/<int:empreendedor_id>/', AvaliacoesLojaView.as_view(), name='loja_avaliacoes'),
    
    # --- AUTENTICAÇÃO ---
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', CustomLoginView.as_view(), name='login'),
    path('auth/users/me/', UserMeView.as_view(), name='user_me'),
    path('auth/users/delete/', DeleteAccountView.as_view(), name='delete_account'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # --- LISTAS AUXILIARES ---
    path('auth/clientes/', ClienteListView.as_view(), name='clientes_list'),
    path('auth/empreendedores/', EmpreendedorListView.as_view(), name='empreendedores_list'),

    # --- SENHA ---
    path('auth/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    
    # --- CRUD PADRÃO ---
    path('', include(router.urls)),
]