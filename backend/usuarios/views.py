from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

class UserMeView(APIView):
    """
    Retorna os dados do usuário logado e verifica se precisa configurar horários.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Lógica de redirecionamento:
        # Se for ADMIN e NÃO tiver nenhum horário de funcionamento cadastrado...
        deve_configurar_horarios = False
        if user.tipo_usuario in ['EMPREENDEDOR', 'ADMIN']:
            # Verificamos se existe algum registro na tabela HorarioFuncionamento para este user
            if not user.horarios_funcionamento.exists():
                deve_configurar_horarios = True

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "tipo_usuario": user.tipo_usuario,
            "nome_completo": user.nome_completo,
            "telefone": user.telefone,
            # Esta é a flag que o seu Front-end vai ler
            "deve_configurar_horarios": deve_configurar_horarios 
        })