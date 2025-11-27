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

    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meus_agendamentos'
    )

    servicos = models.ManyToManyField(Servico, related_name='agendamentos')

    data_hora_inicio = models.DateTimeField(verbose_name="Data e Hora do Início")
    data_hora_fim = models.DateTimeField(verbose_name="Data e Hora do Fim", blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    
    criado_em = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações do Cliente")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Agendamento de {self.cliente} em {self.data_hora_inicio.strftime('%d/%m %H:%M')}"
    
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
        related_name='horarios_funcionamento',
        null=True, blank=True 
    )

    # CORREÇÃO AQUI: Removido o unique=True, pois agora a unicidade é par (usuario + dia)
    dia_semana = models.IntegerField(choices=DIAS_SEMANA) 
    
    horario_abertura = models.TimeField()
    horario_fechamento = models.TimeField()
    fechado = models.BooleanField(default=False)

    def __str__(self):
        status = "Fechado" if self.fechado else f"{self.horario_abertura} - {self.horario_fechamento}"
        user_str = self.usuario.username if self.usuario else "Geral"
        return f"{user_str} - {self.get_dia_semana_display()}: {status}"
    
    class Meta:
        ordering = ['dia_semana']
        verbose_name = "Horário de Funcionamento"
        verbose_name_plural = "Horários de Funcionamento"
        
        # CORREÇÃO AQUI: Garante que UM usuário não tenha DOIS horários para o MESMO dia
        unique_together = ('usuario', 'dia_semana')