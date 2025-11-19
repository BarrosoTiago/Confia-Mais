from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

class CustomUserAdmin(UserAdmin):
    # Define quais campos aparecem na lista de usuários
    list_display = ('username', 'email', 'nome_completo', 'tipo_usuario', 'is_staff')
    
    # Adiciona filtros laterais
    list_filter = ('tipo_usuario', 'is_staff', 'is_active')

    # Define os campos que aparecem no formulário de edição
    # Precisamos adicionar nossos campos customizados (telefone, tipo, nome_completo) aqui
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Personalizadas', {'fields': ('tipo_usuario', 'telefone', 'nome_completo')}),
    )
    
    # Define os campos que aparecem na criação de usuário
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informações Personalizadas', {'fields': ('tipo_usuario', 'telefone', 'nome_completo')}),
    )

admin.site.register(Usuario, CustomUserAdmin)