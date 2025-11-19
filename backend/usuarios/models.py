from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    # 1. Definição dos Tipos de Usuário (Enum)
    TIPO_CHOICES = (
        ('ADMIN', 'Administrador (Empreendedor)'),
        ('CLIENTE', 'Cliente'),
    )

    # 2. Campos Personalizados (Baseado no seu Diagrama)
    tipo_usuario = models.CharField(
        max_length=10, 
        choices=TIPO_CHOICES, 
        default='CLIENTE',
        verbose_name="Tipo de Usuário"
    )
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    
    # O campo 'nomeCompleto' do diagrama pode ser mapeado para o first_name do Django
    # ou podemos criar um específico se você preferir ignorar o first_name/last_name.
    # Vou criar um campo específico para ficar igual ao seu diagrama:
    nome_completo = models.CharField(max_length=255, blank=True, verbose_name="Nome Completo")

    # Campos que o AbstractUser JÁ INCLUI automaticamente (não precisa reescrever):
    # - id (vira idUsuarios)
    # - username (login)
    # - password (senhaHash)
    # - email
    # - is_active, is_staff, date_joined...

    def save(self, *args, **kwargs):
        # Lógica extra: Se for ADMIN, garante que ele tenha acesso ao painel admin
        if self.tipo_usuario == 'ADMIN':
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_tipo_usuario_display()})"