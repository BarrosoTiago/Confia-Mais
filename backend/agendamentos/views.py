from rest_framework import viewsets, permissions
from .models import Agendamento
from .serializers import AgendamentoSerializer

class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated] # Só logado acessa

    def get_queryset(self):
        """
        Filtra os agendamentos baseados em quem está logado.
        """
        user = self.request.user
        
        if user.tipo_usuario == 'ADMIN':
            return Agendamento.objects.all() # Admin vê tudo
        
        # Cliente vê só os dele
        return Agendamento.objects.filter(cliente=user)

    def perform_create(self, serializer):
        """
        Quando criar um agendamento, preenche o campo 'cliente' 
        automaticamente com o usuário logado.
        """
        serializer.save(cliente=self.request.user)