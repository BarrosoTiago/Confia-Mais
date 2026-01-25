from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q 

# Import obrigatório para aceitar JSON e Arquivos (Corrige erro 415)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser 

from .serializers import (
    UserRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    UserUpdateSerializer,
    ServicoSerializer,
    HorarioConfigSerializer
)

try:
    from agendamentos.models import Agendamento, HorarioFuncionamento
    from servicos.models import Servico
except ImportError:
    pass

User = get_user_model()

# --- 1. REGISTRO ---
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "tipo_usuario": getattr(user, 'tipo_usuario', 'CLIENTE'),
                "setup_concluido": False
            },
            "message": "Usuário registrado com sucesso!"
        }, status=status.HTTP_201_CREATED)

# --- 2. LOGIN ---
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer 

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            if access_token and refresh_token:
                response.set_cookie(
                    key='refresh_token', value=refresh_token,
                    httponly=True, samesite='Strict', secure=False, 
                )
        return response

# --- 3. QUEM SOU EU (UserMe) ---
class UserMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserUpdateSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        user = request.user
        deve_configurar_horarios = False
        if user.tipo_usuario == 'ADMIN':
            if hasattr(user, 'horarios_funcionamento') and not user.horarios_funcionamento.exists():
                deve_configurar_horarios = True
        response.data['deve_configurar_horarios'] = deve_configurar_horarios
        return response

# --- 4. EXCLUIR CONTA ---
class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        password = request.data.get('password')

        if not password:
            return Response({"detail": "Senha obrigatória."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(password):
            return Response({"detail": "Senha incorreta."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user.delete()
            return Response({"detail": "Conta excluída."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 5. LOGOUT ---
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout realizado."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response

# --- 6. LISTAS ---
class ClienteListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def list(self, request, *args, **kwargs):
        user_admin = self.request.user
        clientes = User.objects.filter(meus_agendamentos__servicos__criado_por=user_admin).distinct().annotate(
            visitas_concluidas=Count('meus_agendamentos', filter=Q(meus_agendamentos__status='CONCLUIDO', meus_agendamentos__servicos__criado_por=user_admin))
        )
        data = []
        for c in clientes:
            data.append({
                "id": c.id, "nome": c.nome_completo or c.username,
                "email": c.email, "telefone": getattr(c, 'telefone', 'Não informado'),
                "visitas": c.visitas_concluidas, "foto": c.foto.url if c.foto else None
            })
        return Response(data)

class EmpreendedorListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny] # Aberto para o cliente encontrar lojas
    serializer_class = UserRegistrationSerializer 
    def get_queryset(self):
        return User.objects.filter(tipo_usuario='ADMIN')

# --- 7. VIEWSETS DO ONBOARDING E VITRINE ---

class ServicoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Serviços. Ajustado para permitir que clientes vejam a vitrine.
    """
    serializer_class = ServicoSerializer

    def get_permissions(self):
        # Permite que qualquer pessoa veja os serviços (Vitrine)
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        # Apenas usuários logados podem criar/editar/deletar
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # 1. Filtro por Empreendedor (Para o Cliente ver uma loja específica)
        # Exemplo de chamada: api/servicos/?empreendedor_id=5
        empreendedor_id = self.request.query_params.get('empreendedor_id')
        if empreendedor_id:
            return Servico.objects.filter(criado_por_id=empreendedor_id)

        # 2. Visão do Empreendedor logado no seu próprio painel de controle
        user = self.request.user
        if user.is_authenticated and getattr(user, 'tipo_usuario', None) == 'ADMIN':
            return Servico.objects.filter(criado_por=user)
        
        # 3. Visão Geral: Se for um cliente navegando sem filtro, mostra serviços ativos
        return Servico.objects.all()

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

class HorarioConfigViewSet(viewsets.ModelViewSet):
    serializer_class = HorarioConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return HorarioFuncionamento.objects.filter(usuario=self.request.user)
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)