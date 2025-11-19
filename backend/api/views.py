from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserRegistrationSerializer, CustomTokenObtainPairSerializer

class UserRegistrationView(generics.CreateAPIView):
    """
    View para registrar um novo usuário.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "message": "Usuário registrado com sucesso!"
        }
        
        return Response(return_data, status=status.HTTP_201_CREATED)

# --- AQUI ESTAVA O ERRO: Mudei o nome para CustomLoginView ---
class CustomLoginView(TokenObtainPairView):
    """
    View de login customizada.
    """
    serializer_class = CustomTokenObtainPairSerializer 

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            if access_token:
                response.data.pop('refresh', None)
                response.set_cookie(
                    key='refresh_token',
                    value=refresh_token,
                    httponly=True,
                    samesite='Strict',
                    secure=False, 
                )
        return response

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nome_completo": getattr(user, 'nome_completo', ''), 
            "tipo_usuario": getattr(user, 'tipo_usuario', 'CLIENTE'),
            "telefone": getattr(user, 'telefone', ''),
        }
        return Response(data, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response = Response({"message": "Logout realizado com sucesso."}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh_token')
        return response