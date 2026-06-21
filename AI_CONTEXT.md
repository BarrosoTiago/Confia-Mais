# Confia+ (ConfiaMais) — Contexto Completo para Agentes de IA

> **Propósito deste documento:** Fornecer contexto suficiente para que qualquer agente de IA (Cursor, Copilot, Claude, etc.) compreenda integralmente a arquitetura, regras de negócio, convenções e estado atual do projeto, permitindo desenvolvimento contínuo sem regressões ou decisões arquiteturais conflitantes.
>
> **Última atualização:** Junho/2026  
> **Versão do documento:** 1.0

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura de Alto Nível](#2-arquitetura-de-alto-nível)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Backend (Django REST API)](#5-backend-django-rest-api)
6. [Frontend (React SPA)](#6-frontend-react-spa)
7. [Modelo de Dados](#7-modelo-de-dados)
8. [Referência de API](#8-referência-de-api)
9. [Autenticação e Autorização](#9-autenticação-e-autorização)
10. [Fluxos de Negócio Críticos](#10-fluxos-de-negócio-críticos)
11. [Integrações Externas](#11-integrações-externas)
12. [Ambiente, Deploy e Configuração](#12-ambiente-deploy-e-configuração)
13. [Convenções de Código](#13-convenções-de-código)
14. [Dívida Técnica e Problemas Conhecidos](#14-dívida-técnica-e-problemas-conhecidos)
15. [Guia para Agentes de IA](#15-guia-para-agentes-de-ia)

---

## 1. Visão Geral do Produto

### 1.1 O que é o Confia+

**Confia+** (repositório: `ConfiaMais`) é um **ERP web simplificado** voltado a **microempreendedores** e **prestadores de serviços** (salões, barbearias, estética, etc.) e seus **clientes finais**.

Combina:
- **Gestão empresarial** (agenda, serviços, finanças, clientes)
- **Marketplace/vitrine** (clientes descobrem lojas e agendam serviços)
- **Controle financeiro** (receitas, despesas, inadimplência, calculadora de preços)

### 1.2 Personas e Papéis

| Papel (Backend) | Papel (Frontend) | Descrição |
|-----------------|------------------|-----------|
| `EMPREENDEDOR` | `ADMIN` (rotas) | Dono da loja: gerencia serviços, horários, agenda, finanças |
| `CLIENTE` | `CLIENTE` | Consumidor: navega vitrine, agenda serviços, avalia |

> **ATENÇÃO:** O frontend usa `role="ADMIN"` nas rotas protegidas, mas o backend persiste `tipo_usuario='EMPREENDEDOR'`. Código legado ainda referencia `'ADMIN'` em alguns views do backend — tratar como bug.

### 1.3 Domínio de Negócio

```
Empreendedor configura loja → Cadastra serviços → Define horários
        ↓
Cliente descobre loja na vitrine → Agenda serviço → Empreendedor confirma
        ↓
Agendamento CONFIRMADO/CONCLUIDO → Transação financeira criada automaticamente
        ↓
Pagamentos registrados → Dashboard atualizado → Inadimplência monitorada
```

### 1.4 URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend | `https://confia-mais.onrender.com` |
| Backend API | `https://confiaplus-api.onrender.com/api` |
| Admin Django | `https://confiaplus-api.onrender.com/admin` |

---

## 2. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (Cliente)                       │
│  React 19 SPA (Vite) — localhost:5173 / confia-mais.onrender.com│
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ AuthContext  │  │ React Router │  │ Axios (api.js)       │  │
│  │ (JWT state)  │  │ (rotas/roles)│  │ + interceptors       │  │
│  └──────────────┘  └──────────────┘  └──────────┬───────────┘  │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │ HTTPS + JWT Bearer
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              Django 5.2 REST API — /api/                         │
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌───────────┐         │
│  │   api   │ │ agendamentos│ │ financeiro│ │ servicos  │         │
│  │ (auth,  │ │ (agenda,   │ │ (transações│ │ (catálogo)│         │
│  │ router) │ │ horários)  │ │ pagamentos)│ │           │         │
│  └────┬────┘ └─────┬──────┘ └─────┬─────┘ └─────┬─────┘         │
│       └────────────┴──────────────┴─────────────┘               │
│                         usuarios (Usuario customizado)             │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
   ┌───────────────┐              ┌───────────────┐
   │  PostgreSQL   │              │  Cloudinary   │
   │  (Render/local)│              │  (mídia/img)  │
   └───────────────┘              └───────────────┘
           │
           ▼
   ┌───────────────┐
   │ Brevo (email) │  ← verificação, recuperação de senha
   │ Gmail SMTP    │  ← notificação de agendamento
   └───────────────┘
```

### 2.1 Padrão Arquitetural

- **Monorepo** com backend e frontend separados na raiz
- **API REST** stateless com JWT
- **SPA** que consome API via Axios
- **Sem WebSockets** — polling de 10s apenas no AdminDashboard
- **Sem Redux/React Query** — estado local por página + Context para auth

---

## 3. Stack Tecnológica

### 3.1 Backend

| Componente | Tecnologia | Versão |
|------------|-----------|--------|
| Linguagem | Python | 3.x |
| Framework | Django | 5.2.7 |
| API | Django REST Framework | 3.16.1 |
| Auth | djangorestframework-simplejwt | 5.3.1 |
| Banco | PostgreSQL (psycopg2-binary) | — |
| Mídia | django-cloudinary-storage | 0.3.0 |
| Estáticos | WhiteNoise | 6.12.0 |
| CORS | django-cors-headers | 4.9.0 |
| Deploy | Gunicorn + Render | — |
| Config | python-decouple, python-dotenv | — |

**Arquivo de dependências:** `requirements.txt` (raiz do projeto; `build.sh` instala da raiz)

### 3.2 Frontend

| Componente | Tecnologia | Versão |
|------------|-----------|--------|
| Framework | React | 19.1.1 |
| Build | Vite | 7.1.7 |
| Roteamento | react-router-dom | 7.9.5 |
| HTTP | axios | 1.12.2 |
| UI | Bootstrap 5 + react-bootstrap | 5.3.8 |
| Ícones | react-icons | 5.5.0 |
| Gráficos | recharts | 3.6.0 |
| Drag-and-drop | @dnd-kit/* | 6.x/10.x |

**Dependências na raiz (`package.json`):** apenas `react-icons`, `react-router-dom`, `recharts` — as demais estão em `frontend/package.json`.

### 3.3 Infraestrutura

- **Hospedagem:** Render.com (backend + frontend)
- **Banco:** PostgreSQL gerenciado (via `DATABASE_URL`)
- **Imagens:** Cloudinary
- **E-mail transacional:** Brevo API (HTTP) + Gmail SMTP (Django send_mail)

---

## 4. Estrutura de Diretórios

```
ConfiaMais/
├── AI_CONTEXT.md          ← ESTE ARQUIVO
├── README.md              ← Setup básico + guia de contribuição Git
├── requirements.txt       ← Dependências Python (usado pelo build.sh)
├── package.json           ← Deps parciais na raiz (legado/ compartilhado)
├── venv/                  ← Ambiente virtual Python (gitignored)
├── node_modules/          ← Deps da raiz (gitignored)
│
├── backend/
│   ├── manage.py
│   ├── build.sh           ← Script de deploy Render
│   ├── .env.example
│   ├── config/            ← Projeto Django principal
│   │   ├── settings.py
│   │   ├── urls.py        ← /admin/ + /api/
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── api/               ← Camada central: auth, dashboard, router
│   │   ├── urls.py        ← MASTER ROUTER de toda a API
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── models.py      ← Tarefa (LEGADO, não usar)
│   │   └── signals.py
│   ├── usuarios/          ← Modelo Usuario customizado
│   ├── servicos/          ← Servico, Categoria
│   ├── agendamentos/      ← Agendamento, Horario, Avaliacao, Anotacao
│   └── financeiro/        ← Transacao, Pagamento, Despesa, Calculadora
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx           ← Entry: Bootstrap CSS + App
        ├── pages/             ← TODAS as páginas + App.jsx (router)
        │   └── App.jsx        ← Rotas + PrivateRoute + AuthProvider
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   └── api.js         ← Axios + JWT interceptors
        ├── components/        ← Apenas 2 componentes compartilhados
        │   ├── AnimatedBackground.jsx
        │   └── OnboardingHeader.jsx
        ├── utils/
        │   └── formatDate.js
        ├── styles/            ← CSS legado (MAIORIA NÃO IMPORTADA)
        └── assets/            ← SVGs, logos, vídeo landing
```

### 4.1 Convenções Estruturais Importantes

1. **`App.jsx` está em `src/pages/`**, não em `src/` — import em `main.jsx`: `./pages/App.jsx`
2. **Cada página é autossuficiente** — fetch, estado e estilos inline na própria página
3. **Router centralizado** em `App.jsx` — não há lazy loading
4. **Backend:** todas as rotas passam por `backend/api/urls.py`
5. **Migrations** ficam dentro de cada app Django

---

## 5. Backend (Django REST API)

### 5.1 Apps Django

| App | Responsabilidade | Arquivos-chave |
|-----|-----------------|----------------|
| `config` | Settings, URLs raiz | `settings.py`, `urls.py` |
| `api` | Auth, registro, dashboard, agregação de rotas | `urls.py`, `views.py`, `serializers.py` |
| `usuarios` | Modelo `Usuario` (AUTH_USER_MODEL) | `models.py` |
| `servicos` | Catálogo de serviços e categorias | `models.py`, `views.py` (CategoriaViewSet) |
| `agendamentos` | Agenda, horários, avaliações, anotações | `models.py`, `views.py`, `serializers.py` |
| `financeiro` | Transações, pagamentos, despesas, calculadora | `models.py`, `views.py`, `signals.py` |

### 5.2 Configurações Críticas (`config/settings.py`)

```python
AUTH_USER_MODEL = 'usuarios.Usuario'
DEBUG = 'RENDER' not in os.environ  # False em produção
USE_TZ = False  # Datetimes naive — timezone America/Sao_Paulo
LANGUAGE_CODE = 'pt-br'

# JWT
ACCESS_TOKEN_LIFETIME = 5 minutos
REFRESH_TOKEN_LIFETIME = 1 dia
ROTATE_REFRESH_TOKENS = True
BLACKLIST_AFTER_ROTATION = True  # ⚠ token_blacklist NÃO está em INSTALLED_APPS

# CORS
CORS_ALLOWED_ORIGINS = localhost:3000, localhost:5173, confia-mais.onrender.com
CORS_ALLOW_CREDENTIALS = True

# Database
DATABASE_URL ou default: postgresql://postgres:postgres@localhost:5432/confiaplus

# Storage
DEFAULT_FILE_STORAGE = cloudinary (mídia)
STATICFILES_STORAGE = whitenoise (estáticos)
```

### 5.3 Variáveis de Ambiente (Backend)

| Variável | Obrigatória | Uso |
|----------|-------------|-----|
| `SECRET_KEY` | Sim (prod) | Django secret |
| `DATABASE_URL` | Sim (prod) | PostgreSQL connection string |
| `CLOUDINARY_CLOUD_NAME` | Sim (prod) | Upload de imagens |
| `CLOUDINARY_API_KEY` | Sim (prod) | Upload de imagens |
| `CLOUDINARY_API_SECRET` | Sim (prod) | Upload de imagens |
| `BREVO_API_KEY` | Sim | E-mails de verificação e recuperação |
| `EMAIL_USER` | Sim | SMTP Gmail (notificações) |
| `EMAIL_PASSWORD` | Sim | SMTP Gmail |
| `RENDER` | Auto | Detecta ambiente produção |
| `RENDER_EXTERNAL_HOSTNAME` | Auto | ALLOWED_HOSTS |
| `DJANGO_SUPERUSER_*` | Opcional | Cria superuser no deploy |

**`.env.example` está incompleto** — faltam Cloudinary, DATABASE_URL, BREVO.

### 5.4 Signals (Efeitos Colaterais Automáticos)

**`financeiro/signals.py`** (carregado via `FinanceiroConfig.ready()`):

| Evento | Ação |
|--------|------|
| `post_save(Agendamento)` com status `CONFIRMADO` ou `CONCLUIDO` | Cria/atualiza `Transacao` e recalcula totais |
| `m2m_changed(Agendamento.servicos)` | Recalcula `Transacao.valor_total` |
| `post_save/post_delete(Pagamento)` | Recalcula status da transação |

**`Pagamento.save/delete()`** também chama `recalcular_totais()` — dupla execução possível.

**`api/signals.py`:** handler para `django_rest_passwordreset` — **provavelmente inativo** (fluxo customizado via Brevo).

### 5.5 Views Ativas vs. Código Morto

| Componente | Status |
|------------|--------|
| `api/views.py` → `ServicoViewSet` | ✅ ATIVO (registrado no router) |
| `servicos/views.py` → `ServicoViewSet` | ❌ DUPLICATA não usada (checa `ADMIN` legado) |
| `servicos/views.py` → `CategoriaViewSet` | ✅ ATIVO |
| `usuarios/views.py` → `UserMeView` | ❌ ÓRFÃ (substituída por `api/views.py`) |
| `api/views.py` → `HorarioConfigViewSet` | ❌ Importada mas NÃO registrada no router |
| `api/models.py` → `Tarefa` | ❌ LEGADO PoC — sem migrations, sem API |
| `api/serializers.py` → `AgendamentoSerializer` | ❌ NÃO USADO (usar `agendamentos/serializers.py`) |
| `django_rest_passwordreset` URLs | ❌ Instalado mas sem include — fluxo Brevo customizado |

---

## 6. Frontend (React SPA)

### 6.1 Entry Point e Bootstrap

```jsx
// main.jsx
import App from './pages/App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
// NÃO importa src/styles/* — estilos são inline por página
```

### 6.2 Roteamento Completo

#### Rotas Públicas

| Rota | Componente | Função |
|------|-----------|--------|
| `/` | `Landing.jsx` | Landing page marketing |
| `/login` | `Login.jsx` | Autenticação |
| `/register` | `Register.jsx` | Cadastro (empreendedor ou cliente) |
| `/recuperar-senha` | `RecuperarSenha.jsx` | Reset de senha (2 etapas) |
| `/verificar-email` | `VerificarEmail.jsx` | Código de 6 dígitos |
| `*` | → `/` | Fallback 404 |

#### Rotas Protegidas — Empreendedor (`role="ADMIN"`)

| Rota | Componente | Função |
|------|-----------|--------|
| `/onboarding` | `Onboarding.jsx` | Wizard alternativo (3 passos) |
| `/admin-dashboard` | `AdminDashboard.jsx` | Dashboard principal (KPIs, DnD cards) |
| `/admin/config-horarios` | `ConfigHorarios.jsx` | Horários semanais |
| `/admin/servicos` | `Servicos.jsx` | CRUD de serviços |
| `/admin/financeiro` | `Financeiro.jsx` | Registro de pagamentos |
| `/admin/financeiro/saude-financeira` | `SaudeFinanceira.jsx` | ⚠️ MOCK DATA |
| `/admin/financeiro/entradas-mes` | `EntradasMes.jsx` | Receitas por período |
| `/admin/inadimplencia` | `Inadimplencia.jsx` | Devedores |
| `/admin/despesas` | `Despesas.jsx` | Despesas + gráfico |
| `/admin/agendamentos` | `Agendamentos.jsx` | Gestão de agenda |
| `/admin/perfil` | `PerfilLoja.jsx` | Perfil da loja |
| `/admin/calculadora` | `CalculadoraPreco.jsx` | Precificação |
| `/admin/clientes` | `Clientes.jsx` | Lista + fidelidade |
| `/admin/anotacoes` | `Anotacoes.jsx` | Post-its |
| `/admin/ajuda` | `Ajuda.jsx` | FAQ estático |

#### Rotas Protegidas — Cliente (`role="CLIENTE"`)

| Rota | Componente | Função |
|------|-----------|--------|
| `/vitrine` | `Vitrine.jsx` | Marketplace de lojas |
| `/meus-agendamentos` | `HistoricoGeral.jsx` | Histórico + avaliações |
| `/cliente-dashboard` | `ClienteDashboard.jsx` | Detalhe da loja + agendar |

#### Rotas Protegidas — Qualquer Usuário Autenticado

| Rota | Componente | Função |
|------|-----------|--------|
| `/conta/configuracoes` | `ConfiguracoesConta.jsx` | Hub de conta |
| `/conta/excluir` | `PerfilUsuario.jsx` | Exclusão de conta |

### 6.3 Guard de Rotas (`PrivateRoute`)

```jsx
// App.jsx — lógica simplificada
if (loading) → spinner
if (!user) → redirect /login
if (role === 'ADMIN' && user.tipo_usuario !== 'EMPREENDEDOR') → /vitrine
if (role === 'CLIENTE' && user.tipo_usuario === 'EMPREENDEDOR') → /admin-dashboard
```

### 6.4 Estado Global (`AuthContext`)

| Estado/Método | Descrição |
|---------------|-----------|
| `user` | Objeto do usuário logado (de `/auth/users/me/`) |
| `loading` | true durante recuperação de sessão |
| `login(username, password)` | POST login → salva tokens → GET me |
| `register(userData)` | POST register |
| `logout()` | Limpa localStorage → redirect /login |
| `notification` / `setNotification` | Toast global (pouco usado) |

**Quirk:** `{!loading && children}` — app fica **em branco** durante verificação de sessão inicial.

### 6.5 Cliente HTTP (`services/api.js`)

```javascript
baseURL: localhost → 'http://127.0.0.1:8000/api'
         produção → 'https://confiaplus-api.onrender.com/api'

localStorage: 'access_token', 'refresh_token'
Interceptor 401 → POST /token/refresh/ → retry request
Fila de requests durante refresh (evita storm)
```

**Sem variáveis de ambiente Vite** — URLs hardcoded por hostname.

### 6.6 Padrão de Estilização

- **Primário:** CSS inline em `<style>` dentro de cada página
- **Bootstrap:** componentes + utilities
- **Design tokens recorrentes:**
  - Navy: `#002B55`
  - Blue: `#2A6F97`, `#014F86`
  - Teal: `#A8DADC`
  - Success: `#2DCE89`
  - Fontes: Libre Baskerville (títulos), Plus Jakarta Sans / Inter (corpo)
- **`src/styles/`:** arquivos legados **não importados** — não usar como referência ativa

### 6.7 Fluxos de Onboarding (Empreendedor)

**Fluxo principal (pós-login):**
```
setup_concluido === false
  → /admin/perfil?onboarding=true
  → /admin/config-horarios?onboarding=true
  → /admin/servicos?onboarding=true (PATCH setup_concluido=true)
  → /admin-dashboard
```

**Fluxo alternativo:** `/onboarding` (componente `Onboarding.jsx` com 3 passos inline)

Componente compartilhado: `OnboardingHeader.jsx` (stepper visual nos 3 passos do fluxo principal)

---

## 7. Modelo de Dados

### 7.1 Diagrama ER

```mermaid
erDiagram
    Usuario ||--o{ Servico : "criado_por"
    Usuario ||--o{ Agendamento : "cliente"
    Usuario ||--o{ HorarioFuncionamento : "usuario"
    Usuario ||--o| CalculadoraPrecificacao : "usuario"
    Usuario ||--o{ Despesa : "usuario"
    Categoria ||--o{ Servico : "categoria"
    Servico }o--o{ Agendamento : "servicos"
    Agendamento ||--o| Avaliacao : "avaliacao"
    Agendamento ||--o| Transacao : "transacao"
    Transacao ||--o{ Pagamento : "pagamentos"
```

### 7.2 Usuario (`usuarios.Usuario`)

Estende `AbstractUser`. `USERNAME_FIELD` padrão = `username`.

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `tipo_usuario` | CharField(15) | `CLIENTE` | `EMPREENDEDOR` ou `CLIENTE` |
| `telefone` | CharField(20) | null | Validado no registro: 11 dígitos, 3º = 9 |
| `nome_completo` | CharField(255) | — | Nome exibido / nome da loja |
| `foto` | ImageField | null | Cloudinary `perfil/` |
| `capa` | ImageField | null | Cloudinary `capas/` |
| `descricao` | TextField | null | Bio da loja |
| `endereco`, `bairro`, `cidade` | CharField | null | Localização |
| `setup_concluido` | BooleanField | false | Onboarding completo |
| `codigo_recuperacao` | CharField(6) | null | OTP reset senha |
| `email_verificado` | BooleanField | false | Bloqueia login se false |
| `codigo_verificacao` | CharField(6) | null | OTP verificação email |

### 7.3 Servico e Categoria

**Categoria:** `nome` (unique) — ex: Cabelo, Barba

**Servico:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `criado_por` | FK → Usuario | Dono |
| `categoria` | FK → Categoria | nullable |
| `nome` | CharField(100) | |
| `descricao` | TextField | nullable |
| `preco` | Decimal(10,2) | |
| `duracao_minutos` | IntegerField | default 30 |
| `ativo` | BooleanField | default true |

### 7.4 Agendamento e Relacionados

**Agendamento:**

| Campo | Tipo | Notas |
|-------|------|-------|
| `cliente` | FK → Usuario | |
| `servicos` | M2M → Servico | |
| `data_hora_inicio` | DateTimeField | |
| `data_hora_fim` | DateTimeField | Calculado pela soma das durações |
| `status` | CharField | `PENDENTE`, `CONFIRMADO`, `CANCELADO`, `CONCLUIDO` |
| `observacoes` | TextField | nullable |

**HorarioFuncionamento:** `usuario`, `dia_semana` (0-6), `horario_inicio/fim`, `almoco_inicio/fim`, `ativo`. Unique: `(usuario, dia_semana)`.

**Avaliacao:** OneToOne com Agendamento. `nota` (1-5), `comentario`.

**Anotacao:** `titulo`, `conteudo`, `cor`, `concluido`. ⚠️ **Sem FK de usuário** — notas globais.

### 7.5 Financeiro

**CalculadoraPrecificacao** (OneToOne Usuario): `custo_fixo_mensal`, `horas_trabalho_mes` (160), `margem_lucro_padrao` (20%)

**Despesa:** `usuario`, `descricao`, `valor`, `data_despesa`, `categoria` (texto livre: "Fixo", "Variável")

**Transacao** (OneToOne Agendamento):
- `valor_total`, `valor_pago`, `status_pagamento` (`PENDENTE`, `PARCIAL`, `PAGO`, `ESTORNADO`)
- Método `recalcular_totais()`: soma preços dos serviços + pagamentos

**Pagamento:** FK → Transacao. `valor`, `forma_pagamento` (`PIX`, `DINHEIRO`, `CARTAO_CREDITO`, `CARTAO_DEBITO`, `BOLETO`), `observacao`

### 7.6 Evolução do Schema (Migrations Relevantes)

1. `usuarios/0005`: `ADMIN` → `EMPREENDEDOR`
2. `agendamentos/0004-0005`: Despesa e Pagamento criados aqui
3. `financeiro/0001-0002`: Módulo financeiro centralizado
4. `agendamentos/0007`: Remove Despesa/Pagamento duplicados do app agendamentos
5. `servicos/0003`: Adiciona Categoria

---

## 8. Referência de API

**Base URL:** `/api/`  
**Auth padrão:** `Authorization: Bearer <access_token>`

### 8.1 Autenticação

| Método | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/register/` | — | `{username, email, password, password_confirm, nome_completo, telefone, tipo_usuario?}` | 201 + user summary |
| POST | `/auth/verificar-email/` | — | `{email, codigo}` | 200 |
| POST | `/auth/login/` | — | `{username, password}` | 200: `{access, refresh, id, username, tipo_usuario, setup_concluido}` |
| GET | `/auth/users/me/` | JWT | — | Perfil completo + `deve_configurar_horarios` |
| PATCH | `/auth/users/me/` | JWT | JSON ou multipart | Perfil atualizado |
| DELETE | `/auth/users/delete/` | JWT | `{password}` | 204 |
| POST | `/auth/logout/` | JWT | — | 200 |
| GET | `/auth/clientes/` | JWT | — | Clientes do empreendedor |
| GET | `/auth/empreendedores/` | — | — | Lista pública de lojas |
| POST | `/recuperar-senha/solicitar/` | — | `{email}` | 200 (sempre, por privacidade) |
| POST | `/recuperar-senha/redefinir/` | — | `{email, codigo, nova_senha}` | 200 |

> ⚠️ **`POST /token/refresh/` NÃO ESTÁ REGISTRADO** — frontend espera esta rota.

### 8.2 Dashboard

| Método | Endpoint | Auth | Notas |
|--------|----------|------|-------|
| GET | `/dashboard/` | JWT + EMPREENDEDOR | KPIs baseados em **preços de serviços** (não pagamentos reais) |

### 8.3 Agendamentos (ViewSet `/agendamentos/`)

| Método | Endpoint | Auth | Notas |
|--------|----------|------|-------|
| GET/POST | `/agendamentos/` | JWT | Filtro por role |
| GET/PUT/PATCH/DELETE | `/agendamentos/{id}/` | JWT | Inclui `financeiro`, `servicos_detalhes` |
| POST | `/agendamentos/{id}/avaliar/` | JWT (cliente dono) | `{nota, comentario?}` |
| GET | `/avaliacoes/loja/{empreendedor_id}/` | — | Avaliações públicas |

**POST body exemplo:**
```json
{
  "servicos": [1, 2],
  "data_hora_inicio": "2026-06-21T14:00:00",
  "observacoes": "Primeira vez",
  "cliente": 5
}
```
(`cliente` opcional — empreendedor pode agendar para cliente)

### 8.4 Horários

| Método | Endpoint | Auth | Notas |
|--------|----------|------|-------|
| CRUD | `/horarios/` | JWT | Escopo: `request.user` |
| GET | `/horarios/disponiveis/?data=YYYY-MM-DD&servico_id=N` | — | Slots `"HH:MM"` |

Algoritmo de slots: intervalos de 30min, exclui almoço e conflitos com agendamentos PENDENTE/CONFIRMADO.

### 8.5 Serviços e Categorias

| Método | Endpoint | Auth | Notas |
|--------|----------|------|-------|
| CRUD | `/servicos/` | Read: —; Write: JWT | `?empreendedor_id=` filtra |
| CRUD | `/categorias/` | Read: —; Write: JWT | |

### 8.6 Financeiro

| Método | Endpoint | Auth | Notas |
|--------|----------|------|-------|
| GET | `/financeiro/dashboard/` | JWT | Receita real (Pagamentos) |
| GET | `/financeiro/transacoes/dashboard/` | JWT | Alias |
| GET | `/api/financeiro/entradas-periodo/?periodo=dia\|semana\|mes\|ano` | JWT | ⚠️ prefixo duplo `/api/api/` |
| GET | `/api/financeiro/despesas-periodo/?periodo=...` | JWT | ⚠️ prefixo duplo |
| GET | `/api/financeiro/saude-financeira/` | JWT | ⚠️ prefixo duplo |
| GET | `/inadimplencia/` | JWT | Transações pendentes/parciais |
| CRUD | `/financeiro/transacoes/` | JWT | |
| CRUD | `/pagamentos/` | JWT | Aceita `agendamento` (int) ou `transacao` |
| CRUD | `/despesas/` | JWT | Escopo: user |
| CRUD | `/calculadora/` | JWT | OneToOne por user |

**POST Pagamento:**
```json
{
  "agendamento": 42,
  "valor": 50.00,
  "forma_pagamento": "PIX",
  "observacao": "Entrada 50%"
}
```

### 8.7 Anotações

| Método | Endpoint | Auth | Notas |
|--------|----------|------|-------|
| CRUD | `/anotacoes/` | JWT | ⚠️ Sem filtro por usuário |

---

## 9. Autenticação e Autorização

### 9.1 Fluxo Completo

```
Registro → email_verificado=false → Email Brevo com código 6 dígitos
    ↓
POST /auth/verificar-email/ → email_verificado=true
    ↓
POST /auth/login/ → JWT access (5min) + refresh (1dia)
    ↓
Frontend salva em localStorage → Axios interceptor anexa Bearer
    ↓
401 → tenta POST /token/refresh/ → retry (⚠️ rota ausente no backend)
```

### 9.2 Permissões

- **Sem DRF Permission Classes customizadas** — controle via `get_queryset()` e checks manuais de `tipo_usuario`
- **Leitura pública:** serviços, categorias, empreendedores, horários disponíveis, avaliações da loja
- **Escrita autenticada:** quase tudo mais
- **Empreendedor only:** dashboard principal, dados financeiros filtrados por owner

### 9.3 Campos do Usuário Retornados em `/auth/users/me/`

Usados pelo frontend: `id`, `username`, `email`, `tipo_usuario`, `setup_concluido`, `nome_completo`, `telefone`, `endereco`, `bairro`, `cidade`, `descricao`, `foto`, `capa`, `deve_configurar_horarios`

---

## 10. Fluxos de Negócio Críticos

### 10.1 Ciclo de Vida do Agendamento

```
1. CREATE (PENDENTE)
   - Valida conflito de horário
   - Calcula data_hora_fim = início + Σ(duracao_minutos)
   - Thread envia email SMTP ao empreendedor

2. CONFIRMADO (empreendedor)
   - Signal cria Transacao com valor_total = Σ(preco serviços)

3. CONCLUIDO
   - Mantém/atualiza Transacao

4. CANCELADO
   - Sem efeito financeiro automático

5. Cliente pode AVALIAR após CONCLUIDO
```

### 10.2 Dois Sistemas de Receita (INCONSISTÊNCIA)

| Endpoint | Fonte de dados | Quando usar |
|----------|-----------------|-------------|
| `/dashboard/` | Soma `Servico.preco` em agendamentos por status/data | Cards do AdminDashboard |
| `/financeiro/dashboard/` | Soma `Pagamento.valor` real | Financeiro, EntradasMes |

**Ao desenvolver:** alinhar ou documentar qual é a fonte da verdade. Pagamentos parciais causam divergência.

### 10.3 Precificação (CalculadoraPreco.jsx)

1. Carrega serviços + despesas + config da calculadora
2. Calcula: custo/hora = (fixos + variáveis) / horas_mes
3. Preço sugerido = custo/hora × (duracao/60) × (1 + margem%)
4. Permite PATCH do preço do serviço

### 10.4 Fidelidade de Clientes (Clientes.jsx)

`META_FIDELIDADE = 10` visitas — barra de progresso calculada no frontend a partir de contagem retornada por `/auth/clientes/`.

---

## 11. Integrações Externas

| Serviço | Uso | Implementação |
|---------|-----|---------------|
| **Cloudinary** | Upload foto/capa de perfil | `DEFAULT_FILE_STORAGE` |
| **Brevo** | Verificação email, reset senha | HTTP direto em `api/views.py` |
| **Gmail SMTP** | Notificação novo agendamento | `django.core.mail.send_mail` |
| **WhatsApp** | Links `wa.me/` pré-preenchidos | Frontend (Inadimplencia, Clientes, Agendamentos) |

---

## 12. Ambiente, Deploy e Configuração

### 12.1 Desenvolvimento Local

**Requisitos:** Python 3.x, Node.js, PostgreSQL local

```bash
# Terminal 1 — Backend
python -m venv venv
.\venv\Scripts\activate          # Windows
pip install -r requirements.txt
cd backend
# Criar .env com SECRET_KEY, DATABASE_URL, etc.
python manage.py migrate
python manage.py runserver       # http://127.0.0.1:8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

### 12.2 Deploy (Render)

**Backend:** `backend/build.sh`
1. `pip install -r requirements.txt`
2. `collectstatic`
3. Verifica estáticos admin
4. `migrate`
5. `createsuperuser` (se env vars presentes)

**Frontend:** build Vite estático servido pelo Render.

### 12.3 Testes

**Cobertura: ~0%** — todos os `tests.py` contêm apenas `# Create your tests here.`

Framework disponível: pytest + pytest-django (em requirements.txt).

### 12.4 Git Workflow

Fork → feature/fix branch → merge upstream/main → PR. Ver `README.md` seção "Como Contribuir".

Prefixos de branch: `feature/`, `fix/`

---

## 13. Convenções de Código

### 13.1 Backend

- **Idioma:** comentários e verbose_name em português
- **Views:** preferir ViewSets para CRUD, APIView para endpoints customizados
- **Serializers:** um por app (`agendamentos/serializers.py`, não duplicar em `api/`)
- **Filtros de ownership:** sempre em `get_queryset()`, nunca confiar no frontend
- **Decimais:** `DecimalField(max_digits=10, decimal_places=2)` para valores monetários
- **Datas:** `USE_TZ = False` — usar datetimes naive consistentemente

### 13.2 Frontend

- **Idioma:** UI em português brasileiro
- **Componentes:** `.jsx` (sem TypeScript)
- **Estado:** `useState` + `useEffect` por página; Context só para auth
- **Feedback:** maioria usa `alert()` — preferir `setNotification()` do AuthContext para consistência
- **Formatação:** `Intl.NumberFormat('pt-BR', {style: 'currency'})` para moeda
- **Navegação entre páginas:** `useNavigate` com `state` para passar dados (ex: loja selecionada)

### 13.3 Nomenclatura

| Contexto | Empreendedor | Cliente |
|----------|-------------|---------|
| Backend DB | `EMPREENDEDOR` | `CLIENTE` |
| Frontend rotas | `role="ADMIN"` | `role="CLIENTE"` |
| UI | "Admin", "Empreendedor", "Loja" | "Cliente" |

---

## 14. Dívida Técnica e Problemas Conhecidos

### 14.1 Bugs Críticos

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 1 | Rota `/token/refresh/` ausente | Sessão expira em 5min sem renovação | `api/urls.py` |
| 2 | Prefixo duplo `/api/api/financeiro/...` | Frontend chama paths errados | `api/urls.py`, páginas financeiras |
| 3 | `BLACKLIST_AFTER_ROTATION` sem `token_blacklist` app | Erro/warning no refresh | `settings.py` |
| 4 | Login verifica `email` mas frontend envia `username` | Verificação de email pode ser bypassed | `api/views.py` CustomLoginView |
| 5 | Imports faltando (`Decimal`, `collections`) em financeiro views | NameError em runtime | `financeiro/views.py` |
| 6 | `Anotacao` sem FK de usuário | Privacidade — todos veem todas as notas | `agendamentos/models.py` |
| 7 | `SaudeFinanceira.jsx` usa mock data | Página não funcional | frontend |
| 8 | `ClienteDashboard` perde state no F5 | Redirect forçado para vitrine | frontend |

### 14.2 Código Legado (NÃO USAR / REMOVER COM CUIDADO)

- `api/models.py` → `Tarefa`
- `servicos/views.py` → `ServicoViewSet` (duplicata)
- `usuarios/views.py` → views órfãs
- `api/views.py` → `HorarioConfigViewSet` (não registrada)
- Referências a `tipo_usuario == 'ADMIN'` no backend
- `django_rest_passwordreset` (instalado, não wired)
- `src/styles/*.css` (não importados)
- `react-calendar` (instalado, não usado)

### 14.3 Melhorias Recomendadas (Não Implementadas)

1. Adicionar `VITE_API_URL` no frontend
2. Extrair layout admin compartilhado (sidebar duplicada)
3. Implementar testes de API para fluxos críticos
4. Unificar fontes de receita nos dashboards
5. Adicionar `usuario` FK em `Anotacao`
6. Migrar `SaudeFinanceira` para API real
7. Completar `.env.example`

---

## 15. Guia para Agentes de IA

### 15.1 Antes de Codificar

1. **Leia este documento** e confirme qual app (backend) ou page (frontend) será alterado
2. **Verifique se já existe código duplicado** (especialmente ServicoViewSet, UserMeView)
3. **Identifique o papel do usuário** afetado (EMPREENDEDOR vs CLIENTE)
4. **Confirme impacto em signals** se alterar Agendamento, Pagamento ou status
5. **Não crie commits** a menos que o usuário peça explicitamente

### 15.2 Ao Modificar Backend

```
✅ FAÇA:
- Registre novas rotas em api/urls.py
- Use get_queryset() para filtrar por usuário
- Mantenha serializers no app correto
- Rode migrate após alterar models
- Use EMPREENDEDOR (não ADMIN)

❌ NÃO FAÇA:
- Duplicar ViewSets entre api/ e outros apps
- Alterar USE_TZ sem migração completa
- Commitar .env ou secrets
- Confiar em Tarefa model
```

### 15.3 Ao Modificar Frontend

```
✅ FAÇA:
- Use import api from '../services/api'
- Proteja rotas com PrivateRoute + role correto
- Mantenha estilos inline consistentes com design tokens
- Trate loading e error states

❌ NÃO FAÇA:
- Hardcodar URLs sem passar pelo api.js
- Usar /api/ prefixo extra (baseURL já inclui)
- Importar src/styles/ legados
- Assumir TypeScript (projeto é JSX puro)
```

### 15.4 Checklist de PR

- [ ] Backend e frontend testados localmente (2 terminais)
- [ ] Migrations criadas se models alterados
- [ ] Sem secrets no diff
- [ ] Rotas registradas em `api/urls.py`
- [ ] Compatível com EMPREENDEDOR/CLIENTE
- [ ] Não reintroduz referências a ADMIN

### 15.5 Comandos Úteis

```bash
# Backend
cd backend && python manage.py makemigrations && python manage.py migrate
python manage.py runserver
python manage.py createsuperuser

# Frontend
cd frontend && npm run dev
npm run build
npm run lint

# Testes (quando implementados)
cd backend && pytest
```

### 15.6 Mapa Rápido: Feature → Arquivos

| Feature | Backend | Frontend |
|---------|---------|----------|
| Login/Auth | `api/views.py`, `api/serializers.py` | `AuthContext.jsx`, `Login.jsx` |
| Registro | `api/views.py` UserRegistrationView | `Register.jsx` |
| Dashboard KPIs | `api/views.py` DashboardView | `AdminDashboard.jsx` |
| Agenda | `agendamentos/views.py` | `Agendamentos.jsx`, `ClienteDashboard.jsx` |
| Horários | `agendamentos/views.py` HorarioViewSet | `ConfigHorarios.jsx` |
| Serviços | `api/views.py` ServicoViewSet | `Servicos.jsx` |
| Pagamentos | `financeiro/views.py` PagamentoViewSet | `Financeiro.jsx` |
| Despesas | `financeiro/views.py` DespesaViewSet | `Despesas.jsx` |
| Vitrine | `api/views.py` EmpreendedorListView | `Vitrine.jsx` |
| Perfil loja | `api/views.py` UserMeView | `PerfilLoja.jsx` |
| Calculadora | `financeiro/views.py` CalculadoraViewSet | `CalculadoraPreco.jsx` |

---

## Apêndice A: Dependências Python Completas

Ver `requirements.txt` na raiz. Principais:
Django 5.2.7, DRF 3.16.1, simplejwt 5.3.1, psycopg2-binary, cloudinary, whitenoise, gunicorn, uvicorn, pytest, resend, django-cors-headers, django-rest-passwordreset, pillow.

## Apêndice B: Páginas Frontend — Resumo de API Calls

| Página | Endpoints consumidos |
|--------|---------------------|
| AdminDashboard | `/dashboard/`, `/financeiro/transacoes/dashboard/`, `/agendamentos/` |
| Agendamentos | `/agendamentos/`, `/horarios/disponiveis/`, `/auth/clientes/`, `/servicos/` |
| Financeiro | `/financeiro/dashboard/`, `/pagamentos/`, `/agendamentos/` |
| Despesas | `/despesas/`, `/api/financeiro/despesas-periodo/` |
| EntradasMes | `/api/financeiro/entradas-periodo/` |
| Inadimplencia | `/inadimplencia/` |
| Vitrine | `/auth/empreendedores/` |
| ClienteDashboard | `/servicos/?empreendedor_id=`, `/horarios/disponiveis/`, POST `/agendamentos/` |
| HistoricoGeral | `/agendamentos/`, POST `/agendamentos/{id}/avaliar/` |
| CalculadoraPreco | `/servicos/`, `/despesas/`, `/calculadora/`, `/financeiro/transacoes/dashboard/` |

## Apêndice C: Glossário

| Termo | Significado |
|-------|-------------|
| ERP | Enterprise Resource Planning — sistema de gestão empresarial |
| MEI | Microempreendedor Individual — público-alvo |
| Fiado | Valor pendente de recebimento (`a_receber`) |
| Transação | Fatura vinculada a um agendamento confirmado |
| Setup/Onboarding | Configuração inicial da loja (perfil → horários → serviços) |
| Vitrine | Marketplace onde clientes encontram empreendedores |

---

*Documento gerado para consumo por agentes de IA. Mantenha atualizado ao introduzir mudanças arquiteturais significativas.*
