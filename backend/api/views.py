from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

# Import obrigatório para upload de arquivos
from rest_framework.parsers import MultiPartParser, FormParser 

from .serializers import (
    UserRegistrationSerializer, 
    CustomTokenObtainPairSerializer,
    UserUpdateSerializer # <--- IMPORT NOVO AQUI
)

User = get_user_model()

# --- 1. VIEW DE CADASTRO (REGISTRO) ---
class UserRegistrationView(generics.CreateAPIView):
    """
    View para registrar um novo usuário (Aberto ao público).
    """
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
    """
    Permite ler (GET) e atualizar (PATCH/PUT) os dados do usuário logado.
    Usa o UserUpdateSerializer para permitir edição sem senha.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    # --- CORREÇÃO FINAL: USA O SERIALIZER QUE NÃO PEDE SENHA ---
    serializer_class = UserUpdateSerializer 
    
    # Permite upload de arquivos
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response
    
class ClienteListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserRegistrationSerializer
    
    def get_queryset(self):
        return User.objects.filter(tipo_usuario='CLIENTE')

class EmpreendedorListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserRegistrationSerializer 

    def get_queryset(self):
        return User.objects.filter(tipo_usuario='ADMIN')