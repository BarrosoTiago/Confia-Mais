from django.contrib import admin
from .models import Agendamento, HorarioFuncionamento

@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'data_hora_inicio', 'status', 'get_servicos')
    list_filter = ('status', 'data_hora_inicio')
    search_fields = ('cliente__username', 'cliente__nome_completo')
    
    # Melhora a interface de seleção de serviços
    filter_horizontal = ('servicos',) 
    
    # Função para mostrar os serviços na lista (Django não mostra ManyToMany direto na lista)
    def get_servicos(self, obj):
        return ", ".join([s.nome for s in obj.servicos.all()])
    get_servicos.short_description = 'Serviços'

@admin.register(HorarioFuncionamento)
class HorarioAdmin(admin.ModelAdmin):
    list_display = ('get_dia_semana_display', 'horario_abertura', 'horario_fechamento', 'fechado')
    ordering = ('dia_semana',)