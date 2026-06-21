from django.db.models.signals import m2m_changed, post_save, post_delete
from django.dispatch import receiver
from agendamentos.models import Agendamento
from .models import Transacao, Pagamento

# 1. Cria a transação assim que um agendamento for Confirmado ou Concluído
@receiver(post_save, sender=Agendamento)
def gerenciar_transacao_agendamento(sender, instance, created, **kwargs):
    if instance.status in ['CONFIRMADO', 'CONCLUIDO']:
        transacao, transacao_criada = Transacao.objects.get_or_create(
            agendamento=instance,
            defaults={'valor_total': 0}
        )
        transacao.recalcular_totais()

# 2. Atualiza os totais se novos serviços forem adicionados/removidos do agendamento
@receiver(m2m_changed, sender=Agendamento.servicos.through)
def atualizar_total_transacao_m2m(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        if hasattr(instance, 'transacao'):
            instance.transacao.recalcular_totais()

# 3. Atualiza os totais e status da transação ao registrar ou apagar um pagamento
@receiver([post_save, post_delete], sender=Pagamento)
def atualizar_valor_pago_transacao(sender, instance, **kwargs):
    if hasattr(instance, 'transacao') and instance.transacao:
        instance.transacao.recalcular_totais()