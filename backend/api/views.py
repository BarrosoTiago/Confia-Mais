from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserRegistrationSerializer

class UserRegistrationView(generics.CreateAPIView):
    """
    View para registrar um novo usuário.
    Aceita requisições POST em /api/register/
    """
    
    # 1. Informa à View qual Serializer usar
    serializer_class = UserRegistrationSerializer
    
    # 2. Informa à View quem pode acessá-la
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """
        # 3. (Opcional) Personaliza a resposta de sucesso
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save() # Isso chama o método .create() do serializer
        
        # Define os dados que queremos retornar ao frontend
        return_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "message": "Usuário registrado com sucesso!"
        }
        
        return Response(return_data, status=status.HTTP_201_CREATED)

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    View de login customizada para enviar o refresh_token em um cookie HttpOnly.
    """
    def post(self, request, *args, **kwargs):
        # Chama o método padrão para obter os tokens
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            if access_token:
                # Remove o refresh token da resposta JSON
                response.data.pop('refresh', None)
                
                # Define o refresh_token no cookie
                response.set_cookie(
                    key='refresh_token',
                    value=refresh_token,
                    httponly=True,       # Impede acesso via JavaScript
                    samesite='Strict',   # Proteção contra CSRF
                    secure=False,         # Em produção colocar True (requer HTTPS); Em desenvolvimento colocar False
                    # max_age=... (opcional, já definido pelo LIFETIME)
                )
        return response

class UserProfileView(APIView):
    """
    View para buscar os dados do usuário logado.
    """
    
    # Esta linha é a que PROTEGE a rota
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Graças ao JWTAuthentication, 'request.user' é o usuário autenticado
        user = request.user
        
        # Você pode usar um serializer para formatar os dados
        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
        return Response(data, status=status.HTTP_200_OK)

class LogoutView(APIView):

    """
    View para invalidar o refresh_token (fazer logout).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Para fazer logout, simplesmente excluímos o cookie
        response = Response({"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        
        # (Opcional: adicionar o refresh token a uma blacklist se você
        # configurou a blacklist no simplejwt)
        
        return response
    
    