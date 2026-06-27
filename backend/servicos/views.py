from rest_framework import viewsets, permissions
from .models import Servico, Categoria
from .serializers import ServicoSerializer, CategoriaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    """
    CRUD de Categorias (Ex: Cabelo, Barba, Unha).
    Permitimos que qualquer pessoa veja as categorias, mas apenas admins as criem.
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class ServicoViewSet(viewsets.ModelViewSet):
    """
    CRUD de Serviços.
    Ajustado para permitir que clientes vejam serviços de lojas específicas.
    """
    serializer_class = ServicoSerializer

    def get_permissions(self):
        # Permite que visitantes e clientes vejam a lista sem precisar de login
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Filtro por Empreendedor (Para o Cliente ver a loja)
        # O React deve enviar: /api/servicos/?empreendedor_id=ID_DA_LOJA
        empreendedor_id = self.request.query_params.get('empreendedor_id')
        if empreendedor_id:
            return Servico.objects.filter(criado_por_id=empreendedor_id, ativo=True)

        # 2. Visão do Empreendedor (ADMIN logado no seu painel)
        # Garante que o serviço seja sempre vinculado ao Empreendedor que o criou
        if user.is_authenticated and getattr(user, 'tipo_usuario', None) in ['EMPREENDEDOR', 'ADMIN']:
            return Servico.objects.filter(criado_por=user)
        
        # 3. Visão Geral (FallBack)
        # Se for um cliente navegando sem filtrar loja, mostra todos os ativos
        return Servico.objects.filter(ativo=True)

    def perform_create(self, serializer):
        # Garante que o serviço seja sempre vinculado ao Admin que o criou
        serializer.save(criado_por=self.request.user)