from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

class CustomUserAdmin(UserAdmin):
    # Define quais campos aparecem na lista de usuários
    list_display = ('username', 'email', 'nome_completo', 'tipo_usuario', 'email_verificado', 'is_staff')
    
    # Adiciona filtros laterais
    list_filter = ('tipo_usuario', 'email_verificado', 'is_staff', 'is_active')

    # Define os campos que aparecem no formulário de edição
    fieldsets = UserAdmin.fieldsets + (
        ('Informações do Estabelecimento (Confia+)', {
            'fields': (
                'tipo_usuario', 
                'nome_completo', 
                'telefone', 
                'foto', 
                'capa', 
                'descricao'
            )
        }),
        ('Localização', {
            'fields': (
                'endereco', 
                'bairro', 
                'cidade'
            )
        }),
        ('Controle de Acesso e Verificação', {
            'fields': (
                'setup_concluido', 
                'email_verificado', 
                'codigo_verificacao', 
                'codigo_recuperacao'
            )
        }),
    )
    
    # Define os campos que aparecem na criação de usuário básico
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informações Iniciais', {'fields': ('tipo_usuario', 'telefone', 'nome_completo')}),
    )

admin.site.register(Usuario, CustomUserAdmin)