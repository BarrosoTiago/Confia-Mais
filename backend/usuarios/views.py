from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

class UserMeView(APIView):
    """
    Retorna os dados do usuário logado (Token JWT).
    Substitui a rota padrão do Djoser para termos controle total.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "tipo_usuario": user.tipo_usuario, # <--- O CAMPO MAIS IMPORTANTE
            "nome_completo": user.nome_completo,
            "telefone": user.telefone
        })