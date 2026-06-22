import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

# Pega o seu modelo de usuário customizado
User = get_user_model()

# ==========================================
# 1. FIXTURES (Preparação do Ambiente)
# ==========================================

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def dados_novo_usuario():
    # Pacote de dados completo com todas as exigências da sua API
    return {
        "username": "maria_teste",
        "email": "maria@teste.com",
        "password": "senha_segura_123",
        "password_confirm": "senha_segura_123", 
        "nome_completo": "Maria da Silva",      
        "telefone": "84999999999",              
        "tipo_usuario": "CLIENTE"
    }

@pytest.fixture
def usuario_existente(dados_novo_usuario):
    # Fazemos uma cópia para salvar no banco
    dados_banco = dados_novo_usuario.copy()
    
    # Removemos o 'password_confirm' da cópia porque o banco não tem (e não precisa) dessa coluna
    dados_banco.pop("password_confirm", None)
    
    # Cria o usuário silenciosamente no banco para testarmos o Login
    return User.objects.create_user(**dados_banco)

# ==========================================
# 2. TESTES DE BASE DE DADOS (Models)
# ==========================================



@pytest.mark.django_db
def test_criacao_usuario_criptografia(dados_novo_usuario):
    # 1. Fazemos uma cópia para não estragar a fixture original
    dados_banco = dados_novo_usuario.copy()
    
    # 2. Removemos os campos que a API exige mas o banco de dados NÃO aceita
    dados_banco.pop("password_confirm", None)
    
    # 3. Agora sim, criamos apenas com o que o banco conhece
    usuario = User.objects.create_user(**dados_banco)
    
    assert usuario.id is not None
    assert usuario.username == "maria_teste"
    assert usuario.tipo_usuario == "CLIENTE"
    
    # Prova real de segurança
    assert usuario.password != "senha_segura_123"
    assert usuario.check_password("senha_segura_123") is True

# ==========================================
# 3. TESTES DE INTEGRAÇÃO (API End-to-End)
# ==========================================

@pytest.mark.django_db
def test_api_registro_novo_usuario(api_client, dados_novo_usuario):
    # Simula alguém preenchendo o formulário de cadastro no React
    response = api_client.post('/api/auth/register/', dados_novo_usuario, format='json')
    
    # Armadilha de debug caso falhe
    if response.status_code != 201:
        print("\n=== MOTIVO DA RECUSA NO REGISTRO ===")
        print(response.data)
        print("====================================\n")
        
    assert response.status_code == 201
    assert User.objects.filter(email="maria@teste.com").exists()

@pytest.mark.django_db
def test_api_login_usuario(api_client, usuario_existente):
    # Simula a tela de login
    credenciais = {
        "username": "maria_teste", # Caso o seu login exija email, troque aqui para "maria@teste.com"
        "password": "senha_segura_123"
    }
    
    response = api_client.post('/api/auth/login/', credenciais, format='json')
    
    if response.status_code != 200:
        print("\n=== MOTIVO DA RECUSA NO LOGIN ===")
        print(response.data)
        print("=================================\n")
        
    assert response.status_code == 200
    
    # Se o login deu certo, a API tem que devolver um Token de acesso (Token ou JWT Access)
    assert 'token' in response.data or 'access' in response.data

@pytest.mark.django_db
def test_api_perfil_protegido(api_client, usuario_existente):
    # 1. Tenta acessar a rota "Me" (Perfil) sem estar logado
    response_negado = api_client.get('/api/auth/users/me/')
    assert response_negado.status_code == 401 # Bloqueado!

    # 2. Faz o login forçado (Simulando que o React enviou o Token)
    api_client.force_authenticate(user=usuario_existente)
    
    # 3. Tenta acessar novamente
    response_permitido = api_client.get('/api/auth/users/me/')
    assert response_permitido.status_code == 200 # Sucesso!
    assert response_permitido.data['username'] == "maria_teste" # Garante que trouxe os dados da Maria