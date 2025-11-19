from django.db import models
from django.conf import settings
from servicos.models import Servico # Importando do outro app que acabamos de criar

class Agendamento(models.Model):
    STATUS_CHOICES = (
        ('PENDENTE', 'Pendente'),
        ('CONFIRMADO', 'Confirmado'),
        ('CANCELADO', 'Cancelado'),
        ('CONCLUIDO', 'Concluído'),
    )

    # 1. Quem agendou? (O Cliente)
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meus_agendamentos'
    )

    # 2. O que foi agendado? (Pode ser 1 ou mais serviços)
    # O Django cria a tabela 'AgendamentoServicos' automaticamente aqui
    servicos = models.ManyToManyField(Servico, related_name='agendamentos')

    # 3. Quando?
    data_hora_inicio = models.DateTimeField(verbose_name="Data e Hora do Início")
    data_hora_fim = models.DateTimeField(verbose_name="Data e Hora do Fim", blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    
    criado_em = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações do Cliente")

    def save(self, *args, **kwargs):
        # Lógica Opcional: Calcular data_fim automaticamente se não for informada
        # Isso é útil se o frontend mandar apenas o início e a lista de serviços
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Agendamento de {self.cliente} em {self.data_hora_inicio.strftime('%d/%m %H:%M')}"
    
    class Meta:
        ordering = ['-data_hora_inicio'] # Mostra os mais recentes primeiro

    
    