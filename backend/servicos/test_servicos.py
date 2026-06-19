import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

# Importação dos modelos do app de serviços
from servicos.models import Servico, Categoria

User = get_user_model()

# ==========================================
# 1. FIXTURES (Preparação do Ambiente)
# ==========================================

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def empreendedor():
    # Cria um empreendedor para ser o "dono" dos serviços
    return User.objects.create_user(
        username="dono_servicos", 
        email="servicos@teste.com", 
        password="123", 
        tipo_usuario="EMPREENDEDOR"
    )

@pytest.fixture
def categoria_teste():
    # Cria uma categoria básica para testar relacionamentos
    return Categoria.objects.create(nome="Estética Facial")


# ==========================================
# 2. TESTES DE BASE DE DADOS (Models)
# ==========================================

@pytest.mark.django_db
def test_criacao_categoria_e_servico_banco(empreendedor, categoria_teste):
    # Testa se o banco salva o serviço e vincula ao criador corretamente
    servico = Servico.objects.create(
        nome="Design de Sobrancelha",
        preco=45.00,
        duracao_minutos=30,
        categoria=categoria_teste,
        criado_por=empreendedor
    )
    
    assert servico.id is not None
    assert servico.nome == "Design de Sobrancelha"
    assert servico.criado_por.username == "dono_servicos"


# ==========================================
# 3. TESTES DE SEGURANÇA (Views / Permissões)
# ==========================================

@pytest.mark.django_db
def test_criacao_servico_nao_autenticado(api_client):
    # Um utilizador anónimo tenta CRIAR um serviço usando a rota POST
    payload = {
        "nome": "Serviço Fantasma",
        "preco": "100.00",
        "duracao_minutos": 60
    }
    response = api_client.post('/api/servicos/', payload, format='json')
    
    # O sistema deve bloquear a criação (401 Unauthorized)
    assert response.status_code == 401


# ==========================================
# 4. TESTES DE INTEGRAÇÃO (API End-to-End)
# ==========================================

@pytest.mark.django_db
def test_integracao_empreendedor_cria_servico(api_client, empreendedor, categoria_teste):
    # 1. Simula o login do Empreendedor
    api_client.force_authenticate(user=empreendedor)
    
    # 2. Monta o pacote de dados do serviço
    payload = {
        "nome": "Limpeza de Pele Profunda",
        "preco": "120.00",
        "duracao_minutos": 90,
        "categoria": categoria_teste.id,
        "criado_por": empreendedor.id
    }
    
    # 3. Dispara a requisição POST
    response = api_client.post('/api/servicos/', payload, format='json')
    
    # Mantemos a "armadilha" caso haja erro de validação (400 Bad Request)
    if response.status_code != 201:
        print("\n=== MOTIVO DA RECUSA (ERRO 400) ===")
        print(response.data)
        print("===================================\n")
    
    # 4. Verifica se a API aceitou e criou (201 Created)
    assert response.status_code == 201
    
    # 5. Confirma na base de dados real
    assert Servico.objects.filter(nome="Limpeza de Pele Profunda").exists()