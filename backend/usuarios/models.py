from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    # 1. Definição dos Tipos de Usuário
    TIPO_CHOICES = (
        ('ADMIN', 'Administrador (Empreendedor)'),
        ('CLIENTE', 'Cliente'),
    )

    # 2. Campos Originais
    tipo_usuario = models.CharField(
        max_length=10, 
        choices=TIPO_CHOICES, 
        default='CLIENTE',
        verbose_name="Tipo de Usuário"
    )
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    nome_completo = models.CharField(max_length=255, blank=True, verbose_name="Nome Completo")

    # 3. IDENTIDADE VISUAL 📸
    foto = models.ImageField(upload_to='perfil/', blank=True, null=True, verbose_name="Logo/Foto de Perfil")
    capa = models.ImageField(upload_to='capas/', blank=True, null=True, verbose_name="Imagem de Capa")

    # 4. LOCALIZAÇÃO E SOBRE (NOVOS CAMPOS) 📍
    # Descrição para o cliente conhecer a loja
    descricao = models.TextField(blank=True, null=True, verbose_name="Sobre a Loja/Bio")
    
    # Endereço para o cliente saber onde ir
    endereco = models.CharField(max_length=255, blank=True, null=True, verbose_name="Endereço (Rua e Número)")
    bairro = models.CharField(max_length=100, blank=True, null=True, verbose_name="Bairro")
    cidade = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cidade")

    def save(self, *args, **kwargs):
        # Lógica extra: Se for ADMIN, garante acesso ao painel admin do Django
        if self.tipo_usuario == 'ADMIN':
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_tipo_usuario_display()})"