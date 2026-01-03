from django.db import models

class Tarefa(models.Model):
    titulo = models.CharField(max_length=100)
    concluida = models.BooleanField(default=False)

    def __str__(self):
        return self.titulo

# Importa os sinais para funcionar o envio de email de senha
try:
    from api import signals
except ImportError:
    pass