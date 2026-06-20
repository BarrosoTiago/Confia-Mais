from django.db import models
from django.conf import settings
from servicos.models import Servico 

class Agendamento(models.Model):
    STATUS_CHOICES = (
        ('PENDENTE', 'Pendente'),
        ('CONFIRMADO', 'Confirmado'),
        ('CANCELADO', 'Cancelado'),
        ('CONCLUIDO', 'Concluído'),
    )

    empreendedor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agendamentos_criados',  # agendamentos do negócio
    )

    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meus_agendamentos',     # agendamentos do cliente
        null=True,
        blank=True,                           # null = cliente walk-in / sem conta
    )

    # Para walk-in ou cliente sem conta no sistema
    cliente_nome_avulso = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Nome do cliente (sem conta)"
    )

    servicos = models.ManyToManyField(Servico, related_name='agendamentos')
    data_hora_inicio = models.DateTimeField()
    data_hora_fim = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    criado_em = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True)

    @property
    def nome_cliente(self):
        """Retorna o nome do cliente independente de ter conta ou não."""
        if self.cliente:
            return self.cliente.get_full_name().strip() or self.cliente.username
        return self.cliente_nome_avulso or "Cliente avulso"

    def __str__(self):
        return f"{self.nome_cliente} com {self.empreendedor} em {self.data_hora_inicio}"

    class Meta:
        ordering = ['-data_hora_inicio']
class HorarioFuncionamento(models.Model):
    DIAS_SEMANA = (
        (0, 'Segunda-feira'),
        (1, 'Terça-feira'),
        (2, 'Quarta-feira'),
        (3, 'Quinta-feira'),
        (4, 'Sexta-feira'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='horarios_funcionamento'
    )

    dia_semana = models.IntegerField(choices=DIAS_SEMANA) 
    
    horario_inicio = models.TimeField(verbose_name="Abertura")
    horario_fim = models.TimeField(verbose_name="Fechamento")
    
    almoco_inicio = models.TimeField(null=True, blank=True, verbose_name="Início Almoço")
    almoco_fim = models.TimeField(null=True, blank=True, verbose_name="Fim Almoço")
    
    ativo = models.BooleanField(default=True, verbose_name="Dia Ativo/Trabalhado")

    def __str__(self):
        return f"{self.usuario} - {self.get_dia_semana_display()}"
    
    class Meta:
        ordering = ['dia_semana']
        unique_together = ('usuario', 'dia_semana')

class Avaliacao(models.Model):
    agendamento = models.OneToOneField(Agendamento, on_delete=models.CASCADE, related_name='avaliacao')
    nota = models.IntegerField(choices=[(i, i) for i in range(1, 6)], verbose_name="Estrelas")
    comentario = models.TextField(blank=True, null=True, verbose_name="Comentário")
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Nota {self.nota} para {self.agendamento}"

# --- NOVO MODELO: DESPESA (Faltava este!) 💸 ---
class Despesa(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='minhas_despesas'
    )
    descricao = models.CharField(max_length=200, verbose_name="Descrição")
    valor = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor (R$)")
    data = models.DateField(verbose_name="Data do Pagamento")
    
    CATEGORIA_CHOICES = (
        ('FIXA', 'Fixa (Aluguel, Internet)'),
        ('VARIAVEL', 'Variável (Produtos, Extras)'),
        ('INVESTIMENTO', 'Investimento'),
    )
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default='VARIAVEL')

    def __str__(self):
        return f"{self.descricao} - R$ {self.valor}"

# --- NOVO MODELO: PAGAMENTOS RECEBIDOS 💰 ---
class Pagamento(models.Model):
    agendamento = models.ForeignKey(Agendamento, on_delete=models.CASCADE, related_name='pagamentos')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    forma = models.CharField(max_length=50, choices=[
        ('PIX', 'Pix'),
        ('DINHEIRO', 'Dinheiro'),
        ('CARTAO_CREDITO', 'Cartão Crédito'),
        ('CARTAO_DEBITO', 'Cartão Débito'),
        ('FIADO', 'Fiado / Pendente')
    ], default='DINHEIRO')
    data = models.DateTimeField(auto_now_add=True)
    observacao = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"R$ {self.valor} ({self.forma})"

class Anotacao(models.Model):
    titulo = models.CharField(max_length=100, blank=True, default="Lembrete")
    conteudo = models.TextField()
    cor = models.CharField(max_length=20, default="#FEF3C7") # Amarelo post-it padrão
    data_criacao = models.DateTimeField(auto_now_add=True)
    concluido = models.BooleanField(default=False)

    def __str__(self):
        return self.titulo