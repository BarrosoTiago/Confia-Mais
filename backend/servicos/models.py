from django.db import models
from django.conf import settings # Para referenciar o Admin

class Servico(models.Model):
    # Quem criou este serviço? (Geralmente o Admin)
    # on_delete=models.SET_NULL: Se o admin for deletado, o serviço continua lá, mas sem dono.
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='servicos_criados'
    )

    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    
    # Usar IntegerField para minutos é mais fácil de lidar no Frontend (React) do que DurationField
    duracao_minutos = models.IntegerField(help_text="Duração em minutos (ex: 30, 60)")
    
    # Decimal é obrigatório para dinheiro (Float perde precisão)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nome} (R$ {self.preco})"