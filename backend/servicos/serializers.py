from rest_framework import serializers
from .models import Servico

class ServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servico
        fields = '__all__'
        # Adicione esta linha para o Backend preencher o dono automaticamente
        read_only_fields = ('criado_por',)