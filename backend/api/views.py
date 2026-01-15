from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q 

# Import obrigatório para upload de arquivos
from rest_framework.parsers import MultiPartParser, FormParser 

from .serializers import (
    UserRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    UserUpdateSerializer
)

# Importar Agendamento para fazer a contagem de fidelidade
from agendamentos.models import Agendamento

User = get_user_model()

# --- 1. VIEW DE CADASTRO (REGISTRO) ---
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
                "nome_completo": getattr(user, 'nome_completo', '')
            },
            "message": "Usuário registrado com sucesso!"
        }, status=status.HTTP_201_CREATED)

# --- 2. VIEW DE LOGIN CUSTOMIZADO ---
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer 

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            if access_token and refresh_token:
                response.set_cookie(
                    key='refresh_token',
                    value=refresh_token,
                    httponly=True,
                    samesite='Strict',
                    secure=False, 
                )
        return response

# --- 3. VIEW "QUEM SOU EU" (UserMeView) ---
class UserMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserUpdateSerializer 
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        response = super().get(request, *args, **kwargs)
        user = request.user
        
        deve_configurar_horarios = False
        if user.tipo_usuario == 'ADMIN':
            if not user.horarios_funcionamento.exists():
                deve_configurar_horarios = True
        
        response.data['deve_configurar_horarios'] = deve_configurar_horarios
        
        return response

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response
    
# --- 4. LISTA DE CLIENTES COM FIDELIDADE (CORRIGIDO) ---
class ClienteListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        # Usuário logado (Empreendedor)
        user_admin = self.request.user
        
        # LÓGICA DE FIDELIDADE CORRIGIDA:
        # Usamos 'meus_agendamentos' em vez de 'agendamentos_cliente'
        
        clientes = User.objects.filter(
            meus_agendamentos__servicos__criado_por=user_admin
        ).distinct().annotate(
            visitas_concluidas=Count(
                'meus_agendamentos', 
                filter=Q(
                    meus_agendamentos__status='CONCLUIDO', 
                    meus_agendamentos__servicos__criado_por=user_admin
                )
            )
        )

        data = []
        for cliente in clientes:
            data.append({
                "id": cliente.id,
                "nome": cliente.nome_completo or cliente.username,
                "email": cliente.email,
                "telefone": getattr(cliente, 'telefone', 'Não informado'),
                "visitas": cliente.visitas_concluidas,
                "foto": cliente.foto.url if cliente.foto else None
            })
            
        return Response(data)

class EmpreendedorListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserRegistrationSerializer 

    def get_queryset(self):
        return User.objects.filter(tipo_usuario='ADMIN')