from django.db import models
from django.conf import settings

# --- NOVO MODELO: CATEGORIA ---
class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True, verbose_name="Nome da Categoria")
    # Ex: Cabelo, Barba, Unha, Estética, Sobrancelha
    
    def __str__(self):
        return self.nome

class Servico(models.Model):
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meus_servicos'
    )
    
    # --- LIGAÇÃO COM A CATEGORIA ---
    # null=True permite que serviços antigos fiquem sem categoria por enquanto
    categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='servicos',
        verbose_name="Categoria"
    )

    nome = models.CharField(max_length=100, verbose_name="Nome do Serviço")
    descricao = models.TextField(blank=True, null=True, verbose_name="Descrição")
    preco = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Preço (R$)")
    
    # Duração em minutos (importante para a agenda)
    duracao_minutos = models.IntegerField(default=30, verbose_name="Duração (min)")

    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nome} - R$ {self.preco}"