from rest_framework import serializers
from .models import Servico

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = '__all__' # Retorna id, nome, preco, duracao, etc.