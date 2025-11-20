from rest_framework import viewsets, permissions
from .models import Servico
from .serializers import ServicoSerializer

class ServicoViewSet(viewsets.ModelViewSet):
    """
    Endpoint para listar e gerenciar serviços.
    """
    queryset = Servico.objects.all().order_by('nome')
    serializer_class = ServicoSerializer
    
    # Mantemos IsAuthenticated para que Clientes possam VER a lista para agendar
    permission_classes = [permissions.IsAuthenticated]

    # <--- ADICIONE ISSO:
    # Igual fizemos nas Despesas, isso preenche o campo 'criado_por' automaticamente
    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)