import pytest
from datetime import date
from django.utils import timezone
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

# Importação dos modelos
from financeiro.models import Despesa, Transacao, Pagamento
from agendamentos.models import Agendamento
from servicos.models import Servico

User = get_user_model()

# ==========================================
# 1. FIXTURES (Preparação do Ambiente)
# ==========================================

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def ambiente_financeiro():
    """Cria o cenário base: um empreendedor, um serviço, um agendamento e uma TRANSAÇÃO."""
    empreendedor = User.objects.create_user(
        username="dono_financas", email="financas@teste.com", password="123", tipo_usuario="EMPREENDEDOR"
    )
    cliente = User.objects.create_user(
        username="cliente_pagador", email="pagador@teste.com", password="123", tipo_usuario="CLIENTE"
    )
    servico = Servico.objects.create(
        nome="Limpeza de Pele", preco=100.00, duracao_minutos=60, criado_por=empreendedor
    )
    agendamento = Agendamento.objects.create(
        cliente=cliente, data_hora_inicio=timezone.now(), status='CONCLUIDO'
    )
    agendamento.servicos.add(servico)
    
    # NOVO: Cria a Transação "Pai" que o seu banco exige para receber pagamentos
    transacao, created = Transacao.objects.get_or_create(
        agendamento=agendamento,
        defaults={'valor_total': 100.00}
    )
    
    return empreendedor, agendamento, transacao


# ==========================================
# 2. TESTES DE BASE DE DADOS (Models)
# ==========================================

@pytest.mark.django_db
def test_criacao_despesa_banco(ambiente_financeiro):
    empreendedor, _, _ = ambiente_financeiro
    
    despesa = Despesa.objects.create(
        usuario=empreendedor,
        descricao="Conta de Luz",
        valor=150.50,
        data_despesa=date.today(), # <-- CORRIGIDO: Era 'data'
        categoria="FIXA"
    )
    
    assert despesa.id is not None
    assert despesa.valor == 150.50

@pytest.mark.django_db
def test_criacao_pagamento_banco(ambiente_financeiro):
    _, _, transacao = ambiente_financeiro # Pega a transação da fixture
    
    pagamento = Pagamento.objects.create(
        transacao=transacao,           # <-- CORRIGIDO: Era 'agendamento'
        valor=100.00,
        forma_pagamento="PIX",         # <-- CORRIGIDO: Era 'forma'
        observacao="Pagamento adiantado"
    )
    
    assert pagamento.id is not None
    assert pagamento.forma_pagamento == "PIX"
    # Navega na relação para garantir que o pagamento chegou no cliente certo
    assert pagamento.transacao.agendamento.cliente.username == "cliente_pagador" 


# ==========================================
# 3. TESTES DE SEGURANÇA (Views / Permissões)
# ==========================================

@pytest.mark.django_db
def test_acesso_despesas_nao_autenticado(api_client):
    response = api_client.get('/api/despesas/')
    assert response.status_code == 401


# ==========================================
# 4. TESTES DE INTEGRAÇÃO (API End-to-End)
# ==========================================

@pytest.mark.django_db
def test_integracao_empreendedor_registra_despesa(api_client, ambiente_financeiro):
    empreendedor, _, _ = ambiente_financeiro
    
    api_client.force_authenticate(user=empreendedor)
    
    # Monta os dados incluindo o ID do utilizador!
    payload = {
        "usuario": empreendedor.id,  # <--- PROVÁVEL SOLUÇÃO AQUI
        "descricao": "Compra de Produtos",
        "valor": "300.00",
        "data": str(date.today()),
        "categoria": "VARIAVEL"
    }
    
    response = api_client.post('/api/despesas/', payload, format='json')
    
    # DICA DE OURO: Se falhar, imprime o erro exato da API no terminal
    if response.status_code != 201:
        print("\n=== MOTIVO DA RECUSA (ERRO 400) ===")
        print(response.data)
        print("===================================\n")
    
    assert response.status_code == 201
    
    despesa_salva = Despesa.objects.last()
    assert despesa_salva.usuario == empreendedor
    assert despesa_salva.descricao == "Compra de Produtos"