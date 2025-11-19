from rest_framework import viewsets, permissions
from .models import Servico
from .serializers import ServicoSerializer

class ServicoViewSet(viewsets.ModelViewSet):
    """
    Endpoint para listar e gerenciar serviços.
    """
    queryset = Servico.objects.all().order_by('nome')
    serializer_class = ServicoSerializer
    
    # Defina quem pode acessar:
    # permissions.IsAuthenticated = Só logado vê
    # permissions.AllowAny = Qualquer um vê (público)
    permission_classes = [permissions.IsAuthenticated]

    # Dica Pro (Opcional): Se você quiser que Clientes SÓ VEJAM e Admin EDITE:
    # Você teria que criar uma permissão customizada, mas por enquanto, 
    # IsAuthenticated resolve, pois seu Frontend (React) é quem vai esconder 
    # os botões de "Editar" do cliente.