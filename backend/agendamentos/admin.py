from django.contrib import admin
from .models import Agendamento, HorarioFuncionamento

@admin.register(Agendamento)
class AgendamentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'data_hora_inicio', 'status', 'criado_em')
    list_filter = ('status', 'data_hora_inicio')
    search_fields = ('cliente__username', 'cliente__nome_completo', 'observacoes')
    ordering = ('-data_hora_inicio',)

@admin.register(HorarioFuncionamento)
class HorarioAdmin(admin.ModelAdmin):
    # CORREÇÃO AQUI: Usando os novos nomes dos campos
    list_display = ('usuario', 'get_dia_nome', 'horario_inicio', 'horario_fim', 'ativo')
    list_filter = ('usuario', 'dia_semana', 'ativo')
    ordering = ('usuario', 'dia_semana')

    # Função auxiliar para mostrar o nome do dia em vez do número (0, 1...)
    def get_dia_nome(self, obj):
        return obj.get_dia_semana_display()
    get_dia_nome.short_description = 'Dia da Semana'