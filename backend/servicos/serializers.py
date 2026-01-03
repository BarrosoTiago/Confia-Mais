from rest_framework import serializers
from .models import Servico, Categoria

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ServicoSerializer(serializers.ModelSerializer):
    # Traz o nome da categoria em vez de apenas o ID (leitura)
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    
    # Traz o nome do dono do serviço (quem criou)
    criado_por_nome = serializers.CharField(source='criado_por.nome_completo', read_only=True)
    criado_por_username = serializers.CharField(source='criado_por.username', read_only=True)

    class Meta:
        model = Servico
        fields = '__all__'
        read_only_fields = ('criado_por',)