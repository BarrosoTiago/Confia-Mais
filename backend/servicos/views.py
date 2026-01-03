from rest_framework import viewsets, permissions
from .models import Servico, Categoria
from .serializers import ServicoSerializer, CategoriaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    """
    CRUD de Categorias (Ex: Cabelo, Barba, Unha)
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated]

class ServicoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Serviços (Ex: Corte Masculino, Manicure)
    """
    serializer_class = ServicoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Se for ADMIN, vê apenas os SEUS serviços
        if user.tipo_usuario == 'ADMIN':
            return Servico.objects.filter(criado_por=user)
        
        # Se for CLIENTE ou Publico, vê TODOS os serviços disponíveis no sistema
        return Servico.objects.all()

    def perform_create(self, serializer):
        # Define automaticamente o dono do serviço como o usuário logado
        serializer.save(criado_por=self.request.user)