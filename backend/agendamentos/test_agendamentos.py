import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

# Importação dos modelos do Confia+
from agendamentos.models import Agendamento
from servicos.models import Servico
from agendamentos.serializers import AgendamentoSerializer

User = get_user_model()

# ==========================================
# 1. FIXTURES (Preparação do Ambiente)
# ==========================================
# As fixtures criam "fantasmas" na base de dados temporária para usarmos nos testes.

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def usuarios_teste():
    # Cria um empreendedor e um cliente fictícios para o teste
    empreendedor = User.objects.create_user(
        username="dono_salao", email="salao@teste.com", password="123", tipo_usuario="EMPREENDEDOR"
    )
    cliente = User.objects.create_user(
        username="joao_cliente", email="joao@teste.com", password="123", tipo_usuario="CLIENTE"
    )
    return empreendedor, cliente

@pytest.fixture
def servico_teste(usuarios_teste):
    empreendedor, _ = usuarios_teste
    # Cria um serviço vinculado ao empreendedor
    return Servico.objects.create(
        nome="Corte de Cabelo", preco=35.00, duracao_minutos=30, criado_por=empreendedor
    )


# ==========================================
# 2. TESTE DE BASE DE DADOS (Models)
# ==========================================
# Valida se o banco de dados do PostgreSQL está a guardar os registos corretamente.

@pytest.mark.django_db
def test_criacao_agendamento_banco(usuarios_teste, servico_teste):
    _, cliente = usuarios_teste
    
    agendamento = Agendamento.objects.create(
        cliente=cliente,
        data_hora_inicio=timezone.now() + timedelta(days=1),
        status='PENDENTE'
    )
    # Adiciona a relação ManyToMany (Muitos para Muitos)
    agendamento.servicos.add(servico_teste)

    # Verificações (Asserts)
    assert agendamento.id is not None
    assert agendamento.cliente.username == "joao_cliente"
    assert agendamento.servicos.count() == 1


# ==========================================
# 3. TESTE DE FORMULÁRIO / SERIALIZER
# ==========================================
# Valida se o sistema bloqueia dados inválidos antes de chegarem à base de dados.

@pytest.mark.django_db
def test_agendamento_serializer_valido(usuarios_teste, servico_teste):
    _, cliente = usuarios_teste
    amanha = timezone.now() + timedelta(days=1)
    
    dados_certos = {
        "cliente": cliente.id,
        "servicos": [servico_teste.id],
        "data_hora_inicio": amanha.isoformat(),
        "status": "PENDENTE"
    }
    
    serializer = AgendamentoSerializer(data=dados_certos)
    assert serializer.is_valid() is True

@pytest.mark.django_db
def test_agendamento_serializer_invalido():
    # Envia dados faltando a data e os serviços
    dados_errados = {
        "status": "PENDENTE"
    }
    serializer = AgendamentoSerializer(data=dados_errados)
    
    assert not serializer.is_valid()
    assert 'data_hora_inicio' in serializer.errors # Confirma que o sistema detetou a falta da data


# ==========================================
# 4. TESTE DE VIEW (Rotas da API)
# ==========================================
# Verifica as regras de segurança e permissões das rotas.

@pytest.mark.django_db
def test_view_lista_agendamentos_nao_autenticado(api_client):
    # Um utilizador anónimo (sem token/login) tenta aceder à lista
    response = api_client.get('/api/agendamentos/')
    
    # O sistema deve bloquear e devolver o erro 401 (Não Autorizado)
    assert response.status_code == 401 


# ==========================================
# 5. TESTE DE INTEGRAÇÃO (End-to-End da API)
# ==========================================
# Testa o fluxo completo: Autenticação -> View -> Serializer -> Base de Dados

@pytest.mark.django_db
def test_integracao_cliente_cria_agendamento(api_client, usuarios_teste, servico_teste):
    empreendedor, cliente = usuarios_teste
    amanha = timezone.now() + timedelta(days=2)
    
    # 1. Simula o login do cliente no React
    api_client.force_authenticate(user=cliente)
    
    # 2. Monta o pacote de dados (JSON) que o React envia
    payload = {
        "servicos": [servico_teste.id],
        "data_hora_inicio": amanha.isoformat()
    }
    
    # 3. Dispara o POST para criar o agendamento
    response = api_client.post('/api/agendamentos/', payload, format='json')
    
    # 4. Verifica se a resposta foi 201 (Created/Criado)
    assert response.status_code == 201
    
    # 5. Prova real: Verifica se a View salvou mesmo o registo no banco
    agendamento_salvo = Agendamento.objects.last()
    assert agendamento_salvo.cliente == cliente
    assert agendamento_salvo.status == 'PENDENTE'