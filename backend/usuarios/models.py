from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    # 1. Definição dos Tipos de Usuário (Separamos Empreendedor de Desenvolvedor)
    TIPO_CHOICES = (
        ('EMPREENDEDOR', 'Empreendedor'), # Mudamos de ADMIN para EMPREENDEDOR
        ('CLIENTE', 'Cliente'),
    )

    # 2. Campos Originais
    tipo_usuario = models.CharField(
        max_length=15, # Aumentei o tamanho para caber a palavra 'EMPREENDEDOR'
        choices=TIPO_CHOICES, 
        default='CLIENTE',
        verbose_name="Tipo de Usuário"
    )
    
    telefone = models.CharField(max_length=20, blank=True, null=True)
    nome_completo = models.CharField(max_length=255, blank=True, verbose_name="Nome Completo")

    # 3. IDENTIDADE VISUAL 📸
    foto = models.ImageField(upload_to='perfil/', blank=True, null=True, verbose_name="Logo/Foto de Perfil")
    capa = models.ImageField(upload_to='capas/', blank=True, null=True, verbose_name="Imagem de Capa")

    # 4. LOCALIZAÇÃO E SOBRE 📍
    descricao = models.TextField(blank=True, null=True, verbose_name="Sobre a Loja/Bio")
    endereco = models.CharField(max_length=255, blank=True, null=True, verbose_name="Endereço (Rua e Número)")
    bairro = models.CharField(max_length=100, blank=True, null=True, verbose_name="Bairro")
    cidade = models.CharField(max_length=100, blank=True, null=True, verbose_name="Cidade")

    # 5. CONTROLE DE ONBOARDING E ACESSO 🚀
    setup_concluido = models.BooleanField(default=False, verbose_name="Setup Inicial Concluído")
    codigo_recuperacao = models.CharField(max_length=6, blank=True, null=True, verbose_name="Código de Recuperação")

    # REMOVEMOS A FUNÇÃO save() QUE DAVA PODERES MÁXIMOS AO EMPREENDEDOR.

    def __str__(self):
        return f"{self.username} ({self.get_tipo_usuario_display()})"