# Contexto Técnico e Arquitetural do Sistema - ConfiaMais

Este documento fornece um detalhamento completo de toda a estrutura do projeto **ConfiaMais**. Ele foi projetado para conceder a uma Inteligência Artificial ou a um novo desenvolvedor o entendimento absoluto de cada componente do sistema, o conteúdo de seus arquivos e como os módulos interagem entre si, incluindo uma análise técnica profunda sobre inconsistências lógicas e regras de negócios a serem observadas.

---

## 🗂️ 1. Estrutura Física de Arquivos e Componentes

### A. Estrutura Geral do Repositório
```text
ConfiaMais/
├── backend/                    # API desenvolvida em Django e Django REST Framework
│   ├── config/                 # Configurações do projeto Django (Configurações Centrais)
│   ├── api/                    # Core da API (Views gerais, Serializadores, Autenticação)
│   ├── usuarios/               # Autenticação e Perfis customizados de usuário
│   ├── servicos/               # Cadastro de Serviços e Categorias
│   ├── agendamentos/           # Agenda, Calendário, Configuração de Horários e Kanban
│   ├── financeiro/             # Lançamento de faturamento, transações, despesas e saúde de caixa
│   ├── manage.py               # Orquestrador de comandos do Django
│   └── requirements.txt        # Dependências do Python
│
├── frontend/                   # Interface SPA desenvolvida em React + Vite
│   ├── public/                 # Assets estáticos públicos do navegador
│   └── src/
│       ├── assets/             # Logos, backgrounds e arquivos de mídia local
│       ├── components/         # Componentes compartilhados e atômicos
│       ├── context/            # Provedor de Contexto (Autenticação e Estado Global)
│       ├── services/           # Instância e Interceptors do Axios (Comunicação com a API)
│       ├── styles/             # Arquivos CSS Globais e Locais
│       ├── utils/              # Funções auxiliares (Máscaras, Validadores, Conversores)
│       └── pages/              # Telas e Visualizações da Aplicação
│
└── AI_CONTEXT.md               # Este documento de referência
```

---

## ⚙️ 2. Detalhamento Técnico do Backend (API Django)

### A. Configurações Globais (`config`)
*   **[settings.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/config/settings.py):**
    *   **Segurança:** Chave secreta carregada via variáveis de ambiente com fallback para desenvolvimento. O parâmetro `DEBUG` é desabilitado em produção (quando detecta o ambiente do Render).
    *   **Armazenamento:** `DEFAULT_FILE_STORAGE` configurado para `cloudinary_storage.storage.MediaCloudinaryStorage` para uploads de imagens em nuvem. Arquivos estáticos (CSS/JS) são servidos localmente ou compilados via `whitenoise.storage.CompressedManifestStaticFilesStorage`.
    *   **Banco de Dados:** Utiliza `dj_database_url` para extrair as credenciais do PostgreSQL da variável `DATABASE_URL` em produção, caindo de volta em um banco de dados local SQLite (`db.sqlite3`) em desenvolvimento.
    *   **CORS:** Configuração restrita apenas para domínios de desenvolvimento (`localhost:3000`, `localhost:5173`) e a URL final de produção no Render.
    *   **JWT:** O SimpleJWT define a validade do Token de Acesso em **5 minutos** e do Token de Atualização (Refresh) em **1 dia**, com a rotação de tokens habilitada.
*   **[urls.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/config/urls.py):** 
    Direciona todas as chamadas de `/api/` para o app de roteamento central [api/urls.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/api/urls.py).

---

### B. Mapeamento de Modelos por App (Banco de Dados)

#### 1. App `usuarios`
*   **[models.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/usuarios/models.py):**
    *   `Usuario` (herda de `AbstractUser`):
        *   `tipo_usuario` (CharField, Choices: `'EMPREENDEDOR'`, `'CLIENTE'`): Define permissões.
        *   `telefone` (CharField): Número do usuário.
        *   `nome_completo` (CharField).
        *   `foto` (ImageField, upload_to='perfil/'): Foto/Logo da loja.
        *   `capa` (ImageField, upload_to='capas/'): Banner de fundo da vitrine.
        *   `descricao` (TextField): Texto sobre a empresa.
        *   `endereco`, `bairro`, `cidade` (CharField): Dados de localização física.
        *   `setup_concluido` (BooleanField): Status do assistente de primeiro acesso.
        *   `codigo_recuperacao` (CharField, 6 dígitos): Recuperação de senha.
        *   `email_verificado` (BooleanField) e `codigo_verificacao` (CharField, 6 dígitos): Fluxo de ativação cadastral.

#### 2. App `servicos`
*   **[models.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/servicos/models.py):**
    *   `Categoria`: Nome da categoria do serviço (ex: Cabelo, Barba, Unhas, Estética). Possui restrição de unicidade.
    *   `Servico`:
        *   `criado_por` (FK para `Usuario`): Empreendedor proprietário do catálogo.
        *   `categoria` (FK para `Categoria`, set null se deletada).
        *   `nome` (CharField).
        *   `descricao` (TextField).
        *   `preco` (DecimalField, 10, 2).
        *   `duracao_minutos` (IntegerField, default=30).
        *   `ativo` (BooleanField).

#### 3. App `agendamentos`
*   **[models.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/agendamentos/models.py):**
    *   `Agendamento`:
        *   `cliente` (FK para `Usuario`): Vincula o consumidor final.
        *   `servicos` (M2M para `Servico`): Os serviços solicitados na reserva.
        *   `data_hora_inicio` e `data_hora_fim` (DateTimeField): Intervalo da agenda. `data_hora_fim` é autocalculada no serializer baseando-se no somatório de duração dos serviços.
        *   `status` (CharField, Choices: `'PENDENTE'`, `'CONFIRMADO'`, `'CANCELADO'`, `'CONCLUIDO'`).
        *   `observacoes` (TextField).
    *   `HorarioFuncionamento`:
        *   `usuario` (FK para `Usuario`): O empreendedor.
        *   `dia_semana` (IntegerField, Choices 0-6): Segunda a Domingo.
        *   `horario_inicio` e `horario_fim` (TimeField): Expediente.
        *   `almoco_inicio` e `almoco_fim` (TimeField): Janela de repouso/intervalo.
        *   `ativo` (BooleanField): Flag de dia trabalhado.
        *   *Restrição:* Chave única composta por `(usuario, dia_semana)`.
    *   `Avaliacao` (OneToOne com `Agendamento`): Nota (1 a 5) e comentário do cliente sobre o serviço recebido.
    *   `Anotacao`: Kanban de tarefas rápidas do empreendedor. Armazena `titulo`, `conteudo`, `cor` (em hex de post-it), `concluido` (BooleanField) e data de criação.

#### 4. App `financeiro`
*   **[models.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/financeiro/models.py):**
    *   `CalculadoraPrecificacao` (OneToOne com `Usuario`): Parâmetros do empreendedor (`custo_fixo_mensal`, `horas_trabalho_mes` e `margem_lucro_padrao`) para sugerir precificação de serviços baseada em taxa/hora mais lucro.
    *   `Transacao` (OneToOne com `Agendamento`):
        *   `valor_total` (DecimalField): Calculado com base na soma dos preços dos serviços.
        *   `valor_pago` (DecimalField): Soma cumulativa de todos os registros de pagamentos vinculados a ela.
        *   `status_pagamento` (CharField, Choices: `'PENDENTE'`, `'PARCIAL'`, `'PAGO'`, `'ESTORNADO'`).
    *   `Pagamento`:
        *   `transacao` (FK para `Transacao`): Vínculo com a fatura.
        *   `valor` (DecimalField): Valor deste pagamento parcial ou total.
        *   `forma_pagamento` (CharField, Choices: `'PIX'`, `'DINHEIRO'`, `'CARTAO_CREDITO'`, `'CARTAO_DEBITO'`, `'BOLETO'`).
        *   `observacao` (CharField).
    *   `Despesa`: Controle de despesas da loja. Armazena `usuario`, `descricao`, `valor`, `data_despesa` (DateField) e `categoria` (ex: Fixo, Variável, Investimento).

---

### C. Mapeamento de Rotas e APIs (`api/urls.py`)

Abaixo estão todos os caminhos expostos pela API e as Views associadas:

| Método HTTP | Endpoint | View | Função / Descrição |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register/` | `UserRegistrationView` | Registro de novos usuários de qualquer tipo. |
| **POST** | `/api/auth/verificar-email/` | `VerificarEmailView` | Ativação de conta por código de verificação enviado por e-mail. |
| **POST** | `/api/auth/login/` | `CustomLoginView` | Login integrado ao SimpleJWT. Retorna tokens de acesso e refresh. |
| **GET** | `/api/auth/users/me/` | `UserMeView` | Detalhes do usuário atual logado e verificação de horários. |
| **DELETE** | `/api/auth/users/delete/` | `DeleteAccountView` | Deleção lógica/física da conta. |
| **POST** | `/api/auth/logout/` | `LogoutView` | Invalida e põe em lista negra o token de atualização. |
| **GET** | `/api/auth/clientes/` | `ClienteListView` | Listagem dos clientes cadastrados para o empreendedor. |
| **GET** | `/api/auth/empreendedores/` | `EmpreendedorListView` | Listagem dos empreendedores cadastrados para o cliente buscar. |
| **POST** | `/api/recuperar-senha/solicitar/` | `SolicitarRecuperacaoSenhaView` | Dispara e-mail com código para troca de senha. |
| **POST** | `/api/recuperar-senha/redefinir/` | `RedefinirSenhaView` | Recebe código e nova senha para redefinição. |
| **GET** | `/api/dashboard/` | `DashboardView` | Métricas gerais de faturamento e agendamentos para o painel principal. |
| **GET/POST/PUT/DEL** | `/api/agendamentos/` | `AgendamentoViewSet` | CRUD dos agendamentos do usuário. |
| **GET/POST/PUT/DEL** | `/api/horarios/` | `HorarioViewSet` | CRUD dos horários de funcionamento do prestador. |
| **GET/POST/PUT/DEL** | `/api/anotacoes/` | `AnotacaoViewSet` | CRUD do mural Kanban/Post-it. |
| **GET/POST/PUT/DEL** | `/api/servicos/` | `ServicoViewSet` | CRUD dos serviços. |
| **GET/POST/PUT/DEL** | `/api/categorias/` | `CategoriaViewSet` | CRUD das categorias de serviço. |
| **GET/POST/PUT/DEL** | `/api/despesas/` | `DespesaViewSet` | CRUD das despesas financeiras. |
| **GET/POST/PUT/DEL** | `/api/calculadora/` | `CalculadoraViewSet` | CRUD dos parâmetros da calculadora de preço. |
| **GET/POST/PUT/DEL** | `/api/financeiro/transacoes/` | `TransacaoViewSet` | Visualização detalhada das faturas de agendamentos. |
| **GET/POST/PUT/DEL** | `/api/pagamentos/` | `PagamentoViewSet` | Lançamento de pagamentos para abater faturas. |
| **GET** | `/api/financeiro/dashboard/` | `FinanceiroDashboardView` | Estatísticas acumuladas e previstas de faturamento de caixa. |
| **GET** | `/api/financeiro/dashboard/` *(Alias)* | `FinanceiroDashboardView` | Rota compatível utilizada pela tela do módulo financeiro. |
| **GET** | `/api/horarios/disponiveis/` | `HorarioDisponivelView` | Calcula slots disponíveis de agenda para um dia e profissional. |
| **GET** | `/api/api/financeiro/entradas-periodo/` | `EntradasPeriodoView` | Lista e agrega pagamentos do período selecionado. |
| **GET** | `/api/api/financeiro/despesas-periodo/` | `DespesasPeriodoView` | Lista e agrega despesas do período selecionado. |
| **GET** | `/api/api/financeiro/saude-financeira/` | `SaudeFinanceiraView` | Relatórios de margens, ponto de equilíbrio e fluxo de caixa. |
| **GET** | `/api/inadimplencia/` | `ClientesInadimplentesView` | Retorna faturas pendentes, contagem de devedores e links WhatsApp. |

---

## 💻 3. Detalhamento Técnico do Frontend (React SPA)

### A. Fluxo de Telas e Páginas (26 Páginas Principais)

1.  **`Landing.jsx`:** Página de marketing institucional do ConfiaMais. Contém explicação de valor do produto, planos e links de cadastro.
2.  **`Login.jsx`:** Autentica o usuário por e-mail e senha. Armazena os dados básicos no `localStorage` e invoca o contexto global de login.
3.  **`Register.jsx`:** Cadastro inicial de conta escolhendo o tipo (`EMPREENDEDOR` ou `CLIENTE`).
4.  **`VerificarEmail.jsx`:** Tela obrigatória logo após cadastro, forçando o input do código de 6 dígitos enviado por e-mail.
5.  **`RecuperarSenha.jsx`:** Formulário para inserção do e-mail, seguido do código de recuperação e input de nova senha.
6.  **`Onboarding.jsx`:** Formulário de primeiro acesso do empreendedor para configurar a loja, descrever a bio, escolher fotos de logo e banner de capa.
7.  **`AdminDashboard.jsx`:** Central do profissional. Lista atendimentos de hoje, faturamento estimado, clientes do dia e painel de progresso do negócio.
8.  **`ClienteDashboard.jsx`:** Painel simplificado para o consumidor final, onde ele gerencia suas reservas ativas e consulta seu histórico de serviços realizados.
9.  **`Agendamentos.jsx`:** Interface de calendário (usando `react-calendar`) e listagem clássica. Permite criar novos agendamentos vinculando serviços e horários.
10. **`Servicos.jsx`:** Cadastro, edição e deleção lógica/física dos serviços que o prestador oferece.
11. **`Clientes.jsx`:** Listagem de todos os clientes que já realizaram serviços com o profissional, exibindo atalhos de contato rápido.
12. **`Anotacoes.jsx`:** Mural virtual de post-its interativos organizados por data e cores de prioridade.
13. **`Vitrine.jsx`:** Página de vitrine de serviços pública de cada loja/empreendedor. Pode ser visualizada por clientes não logados para selecionar serviços e agendar.
14. **`Financeiro.jsx`:** Tela central de controle do faturamento. Exibe cards de receita mensal, entradas, fluxo de contas e listagem de últimas faturas.
15. **`Despesas.jsx`:** Controle detalhado e lançamentos de despesas operacionais da empresa.
16. **`EntradasMes.jsx`:** Relatório detalhado com todas as receitas que entraram no mês atual, agrupadas por formas de pagamento.
17. **`SaudeFinanceira.jsx`:** Apresentação gráfica (via Recharts) demonstrando o fluxo de caixa dos últimos 5 meses, margens de lucro operacionais e ponto de equilíbrio.
18. **`Inadimplencia.jsx`:** Painel de controle de cobranças de inadimplentes. Exibe duas visualizações gráficas ("Volume Total por Cliente" e "Volume por Serviço"), lista de devedores e botão gerador de mensagens customizadas de cobrança para WhatsApp.
19. **`CalculadoraPreco.jsx`:** Assistente contábil que sugere o preço mínimo de venda de serviços com base em despesas fixas reais e horas produtivas mensais do profissional.
20. **`ConfigHorarios.jsx`:** Tela para o empreendedor gerenciar seus dias trabalhados e janelas de funcionamento semanais.
21. **`ConfiguracoesConta.jsx`:** Gerenciamento dos dados cadastrais básicos da conta de acesso.
22. **`PerfilLoja.jsx`:** Edição pública das informações da loja (endereço, bio, foto, capa) que serão exibidas na Vitrine.
23. **`PerfilUsuario.jsx`:** Edição de dados pessoais para usuários do tipo cliente.
24. **`Ajuda.jsx`:** Central de FAQ (perguntas frequentes) e contato de suporte.
25. **`HistoricoGeral.jsx`:** Relatório histórico estrito de agendamentos e transações anteriores.
26. **`App.jsx`:** Roteador global da aplicação frontend, importando todas as páginas acima, aplicando as restrições de rotas privadas (autenticadas) e de rotas exclusivas para o Empreendedor.

---

## 🔗 4. Pontos Críticos de Conexão e Lógica de Negócios

### A. Validação de Disponibilidade de Slots (`HorarioDisponivelView`)
O backend calcula dinamicamente os horários livres com base nas configurações e na agenda ocupada:

```text
Entrada: Data de Agendamento + Prestador de Serviço
1. Busca HorarioFuncionamento ativo para o Dia da Semana correspondente
2. Gera intervalos (slots) de tempo (padrão 30 minutos) entre Abertura e Fechamento
3. Remove intervalos que sobreponham a janela de Almoço (almoco_inicio -> almoco_fim)
4. Busca Agendamentos com status 'PENDENTE' ou 'CONFIRMADO' para o prestador no dia
5. Filtra e remove slots que colidam com agendamentos existentes (inicio < slot_fim e fim > slot_inicio)
Retorno: Array de strings ["08:00", "08:30", "09:30", ...]
```

### B. Ciclo de Vida da Transação Financeira (Signals)
1.  **Criação:** A `Transacao` é gerada apenas quando um `Agendamento` muda de status para `'CONFIRMADO'` ou `'CONCLUIDO'`. Agendamentos no status `'PENDENTE'` (criados por clientes e ainda não aprovados pelo empreendedor) não geram impacto financeiro no banco.
2.  **Sincronização M:N:** Se o empreendedor adicionar ou remover serviços de um agendamento existente, o trigger `m2m_changed` detecta a mudança e invoca `recalcular_totais()` para atualizar o total a pagar da `Transacao`.
3.  **Liquidação:** Cada vez que um `Pagamento` é inserido na transação, o sistema soma os pagamentos existentes. Se o acumulado igualar ou exceder o total previsto, o `status_pagamento` altera para `'PAGO'`. Se o acumulado for maior que 0 mas menor que o total, o status vira `'PARCIAL'`.

---

## 🔎 5. Relatório do Testador Lógico: Inconsistências Ocultas e Bugs

Este relatório apresenta bugs e caminhos de erro no código atual do projeto que necessitam de intervenção técnica:

### 🔴 1. A Inconsistência Crítica de Role (`ADMIN` vs `EMPREENDEDOR`)
*   **Contexto:** O modelo de usuário no banco de dados (`Usuario.tipo_usuario`) utiliza os valores `'EMPREENDEDOR'` e `'CLIENTE'`. O termo `'ADMIN'` foi totalmente removido do modelo e de sua migration de banco de dados correspondente.
*   **Ponto de Falha 1 (Cadastro de Serviços):** Em [servicos/views.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/servicos/views.py#L41), o método `get_queryset` possui a linha:
    `if user.is_authenticated and getattr(user, 'tipo_usuario', None) == 'ADMIN':`
    **Efeito:** Como os empreendedores possuem a string `'EMPREENDEDOR'`, o código falha na validação de permissão. O empreendedor cai na view de fallback que exibe a listagem pública de serviços de todos os profissionais misturados, em vez de ver e gerenciar apenas os seus serviços na tela.
*   **Ponto de Falha 2 (Alerta de Onboarding de Horários):** Em [usuarios/views.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/usuarios/views.py#L17), a checagem que decide se exibe ou não o alerta de configuração obrigatória de horários é:
    `if user.tipo_usuario == 'ADMIN':`
    **Efeito:** A validação falha e a variável `deve_configurar_horarios` é retornada sempre como `False`. Novos empreendedores nunca são alertados a cadastrar sua janela de funcionamento, fazendo com que sua agenda de atendimento fique desativada indefinidamente por falta de configuração inicial de horários.
*   **Solução Recomendada:** Substituir todas as validações diretas de igualdade de string por testes de pertencimento de lista: `in ['EMPREENDEDOR', 'ADMIN']` para garantir compatibilidade e cobrir o banco de dados.

### 🟡 2. Rotas Duplicadas e Mismatch de Roteamento Base
*   **Contexto:** No arquivo [api/urls.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/api/urls.py), algumas rotas foram declaradas adicionando manualmente o prefixo `api/` no argumento:
    `path('api/financeiro/entradas-periodo/', EntradasPeriodoView.as_view(), ...)`
    `path('api/financeiro/despesas-periodo/', DespesasPeriodoView.as_view(), ...)`
    `path('api/financeiro/saude-financeira/', SaudeFinanceiraView.as_view(), ...)`
*   **Efeito:** Como o arquivo principal de URLs do Django (`config/urls.py`) já delega a pasta `/api/` para este arquivo, os endpoints reais no servidor de aplicação se tornaram:
    `http://127.0.0.1:8000/api/api/financeiro/entradas-periodo/` (com duas pastas `/api/api/`).
    A maioria das requisições do frontend chamam apenas `/api/financeiro/...` ou forçam caminhos de forma inconsistente no código.
*   **Solução Recomendada:** Alterar os caminhos no arquivo [api/urls.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/api/urls.py) para remover o prefixo `api/` interno (ex: mudar para `path('financeiro/entradas-periodo/', ...)`).

### 🟡 3. Modelos Zumbis / Duplicados (`Despesa` e `Pagamento`)
*   **Contexto:** O arquivo [agendamentos/models.py](file:///C:/Users/tiago/projetosifrn/ConfiaMais/backend/agendamentos/models.py) mantém definições de classes ativas para os modelos `Despesa` e `Pagamento` (a partir da linha 79).
*   **Efeito:** Estes modelos geram tabelas no banco de dados (`agendamentos_despesa` e `agendamentos_pagamento`), mas não possuem views, serializers ou referências na interface. Todo o sistema do ConfiaMais já utiliza as tabelas geradas no app `financeiro` (`financeiro_despesa` e `financeiro_pagamento`). Isso gera confusão ao realizar backups e manutenção de integridade.
*   **Solução Recomendada:** Apagar estas classes do arquivo de modelos de agendamento e gerar a migration para remover estas tabelas órfãs.

### 🟢 4. Tratamento de Inadimplentes e Duração Negativa de Atrasos
*   **Contexto:** Na view `ClientesInadimplentesView`, a API agrupa faturas a receber. No cálculo de atraso, o sistema calcula os dias decorridos da data de agendamento em relação à data atual: `(hoje - data_servico).days`.
*   **Ponto de Falha:** Para agendamentos confirmados em datas futuras (com faturamento agendado mas ainda não concluído), a subtração de data gera um número inteiro negativo.
*   **Mitigação Atual:** O backend contém uma regra de mitigação preventiva que zera os dias caso a data seja futura (`dias_atraso = 0`), mas qualquer modificação futura nessa lógica de subtração deve ter atenção para evitar indexações negativas em cálculos de gráficos.
