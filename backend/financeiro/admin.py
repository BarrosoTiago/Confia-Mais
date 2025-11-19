from django.contrib import admin
from .models import CalculadoraPrecificacao, Despesa, Transacao, Pagamento

# Configuração para exibir pagamentos DENTRO da Transação
class PagamentoInline(admin.TabularInline):
    model = Pagamento
    extra = 0 # Não mostra linhas vazias extras
    readonly_fields = ('data_pagamento',) # Opcional

@admin.register(Transacao)
class TransacaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'agendamento', 'valor_total', 'valor_pago', 'status_pagamento')
    list_filter = ('status_pagamento',)
    readonly_fields = ('valor_total', 'valor_pago', 'status_pagamento') # Campos calculados não devem ser editados manualmente
    
    # Aqui está a mágica:
    inlines = [PagamentoInline]

@admin.register(Pagamento)
class PagamentoAdmin(admin.ModelAdmin):
    list_display = ('transacao', 'valor', 'forma_pagamento', 'data_pagamento')

# ... (Mantenha Despesa e Calculadora) ...
admin.site.register(CalculadoraPrecificacao)
admin.site.register(Despesa)