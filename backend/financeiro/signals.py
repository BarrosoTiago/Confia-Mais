from django.db.models.signals import m2m_changed, post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from agendamentos.models import Agendamento
from .models import Transacao, Pagamento

# 1. Mantém a Transação sincronizada com os Serviços do Agendamento
@receiver(m2m_changed, sender=Agendamento.servicos.through)
def atualizar_valor_total_transacao(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        total = instance.servicos.aggregate(Sum('preco'))['preco__sum'] or 0
        
        transacao, created = Transacao.objects.get_or_create(
            agendamento=instance,
            defaults={'valor_total': total}
        )
        
        if not created:
            transacao.valor_total = total
            transacao.save()
            # Recalcula status caso o valor total mude
            atualizar_status_transacao(transacao)

# 2. Lógica de Pagamento Parcial (Soma os pagamentos e atualiza a Transação)
@receiver([post_save, post_delete], sender=Pagamento)
def atualizar_valor_pago_transacao(sender, instance, **kwargs):
    """
    Sempre que um pagamento for criado, editado ou deletado,
    recalculamos o quanto já foi pago na transação pai.
    """
    transacao = instance.transacao
    atualizar_status_transacao(transacao)

def atualizar_status_transacao(transacao):
    # Soma todos os pagamentos filhos
    total_pago = transacao.pagamentos.aggregate(Sum('valor'))['valor__sum'] or 0
    transacao.valor_pago = total_pago

    # Define o Status automaticamente
    if transacao.valor_pago >= transacao.valor_total:
        transacao.status_pagamento = 'PAGO'
    elif transacao.valor_pago > 0:
        transacao.status_pagamento = 'PARCIAL'
    else:
        transacao.status_pagamento = 'PENDENTE'
    
    transacao.save()