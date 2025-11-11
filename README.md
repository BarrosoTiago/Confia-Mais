# Projeto ERP - CONFIA +

## O que é um ERP?
Um **ERP (Enterprise Resource Planning)** é um **sistema integrado de gestão empresarial** que reúne, em uma única plataforma, os principais processos de uma organização — como finanças, compras, vendas, estoque, produção e recursos humanos — permitindo que todos os setores compartilhem informações em tempo real e trabalhem de forma mais eficiente e centralizada.

## O que é o Confia +?
UM **ERP** simplificado, de tamanho reduzido e disponível na web, com o foco nas necessidades de microempreendedores.

## Setup do Projeto

Siga os passos abaixo para configurar o ambiente de desenvolvimento local.

1.  **Clone o repositório**
    git clone [Aqui vai a URL (link) do repositório]
    cd [Nome da pasta]

2.  **Crie e ative o ambiente virtual**
    ```bash
    python -m venv venv 
    .\venv\Scripts\activate
    ```

3.  **Instale as dependências**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Rode as migrações**
    ```bash
    python manage.py migrate
    ```


-----
<br>

## Como Rodar o Projeto (Ambiente de Desenvolvimento)

Para rodar o projeto localmente, você precisará de **dois terminais** abertos simultaneamente: um para o Backend (Django) e um para o Frontend (React).

### Terminal 1: Rodando o Backend (Django)

1.  Abra seu terminal e navegue até a pasta `backend`:

    ```bash
    cd /caminho/para/seu-projeto/backend
    ```

2.  Ative o ambiente virtual (venv). Se o seu `venv` está na raiz do projeto (um nível acima):

    ```bash
    ..\venv\Scripts\activate

    ```

    *(Seu prompt deve agora começar com `(venv)`)*

3.  Inicie o servidor do Django:

    ```bash
    py manage.py runserver
    ```

4.  **Pronto\!** O backend estará rodando em `http://127.0.0.1:8000/`.

-----

### Terminal 2: Rodando o Frontend (React + Vite)

1.  Abra um **novo** terminal (mantenha o primeiro rodando\!).
2.  Navegue até a pasta `frontend`:
    ```bash
    cd /caminho/para/seu-projeto/frontend
    ```
3.  **(Se for a primeira vez)** Instale as dependências:
    ```bash
    npm install
    ```
4.  Inicie o servidor de desenvolvimento do Vite:
    ```bash
    npm run dev
    ```
5.  **Pronto\!** O terminal mostrará a URL do frontend. Por padrão, será `http://localhost:5173/`.

-----

### Verificação

Abra `http://localhost:5173/` (a URL do frontend) no seu navegador. Você deverá ver a interface do React carregando os dados do backend (que está em `http://127.0.0.1:8000/`). Dica: Para facilitar, use o Terminal Dividido (Split Terminal) do VS Code. Assim, você pode rodar os dois, lado a lado, na mesma janela.

<br>

# NOTAS

**Nota:** O app `api` atualmente contém um modelo `Tarefa` como prova de conceito para validar a comunicação entre Django e React. Este modelo deve ser substituído pela lógica de negócio real do ERP (ex: Produtos, Finanças, etc.), entre outras partes do backend que ainda não foram desenvolvidas.

Certo. Adicionar essas explicações conceituais na seção 0 é uma excelente ideia. Isso vai solidificar a importância das boas práticas que vêm depois.

Aqui está o `README.md` atualizado com as novas explicações:

-----
<br>

# Como Contribuir (Metodologia Fork & Pull Request)

Este projeto utiliza um fluxo de trabalho baseado em **Forks** e **Linha de Comando (CLI)**. Siga este guia para garantir que o processo de contribuição seja organizado e padronizado.

## 0. Informações Essenciais

**Repositórios:**
* **Repositório Principal (`upstream`):** É o repositório central do projeto. Apenas o mantenedor (líder) tem acesso de escrita. É para onde seu código será enviado no final.
* **Seu Fork (`origin`):** É uma cópia pessoal sua do repositório principal, que fica no seu perfil do GitHub. É aqui que você tem permissão de escrita e onde você enviará suas branches de trabalho.

**Conceitos:**
* **Branch `main`:** A branch principal *do repositório principal* (`upstream`). Ela DEVE estar sempre funcional.
* **Branch (Ramificação):** É uma cópia isolada do projeto *no seu fork* onde você trabalha em uma tarefa.
* **Padrão de Nomes de Branch:** Usamos prefixos claros para organizar o trabalho:
    * `feature/`: Para adicionar uma nova funcionalidade (ex: `feature/login-jwt`).
    * `fix/`: Para corrigir um bug (ex: `fix/bug-calculo-estoque`).
    * **Porquê?** Isso torna o histórico do projeto legível. Com uma rápida olhada, qualquer pessoa da equipe sabe o *propósito* daquela branch.
* **Pull Request (PR):** É um "Pedido de Integração". Quando você termina seu trabalho *no seu fork*, você abre um Pull Request. Isso notifica o mantenedor para que seu código seja revisado e, se aprovado, integrado ao **repositório principal**.
* **Por que sincronizar?** Para evitar conflitos. A `main` do repositório principal (`upstream`) pode ter recebido código novo de outros colegas *enquanto* você trabalhava. Trazer essas atualizações para a sua branch *antes* de abrir o PR permite que você resolva qualquer conflito localmente.
* **O que o `Rebase` faz?** É a nossa forma preferida de sincronizar. Ele pega os seus commits, atualiza sua branch com o código mais recente da `main` do `upstream` e, em seguida, "re-aplica" os seus commits no topo. O resultado é um histórico de commits limpo e linear.

**O Fluxo de Trabalho é:**
1.  **Sincronizar Fork:** Atualizar a `main` do *seu fork* com a `main` do *repositório principal*.
2.  **Criar Branch:** Criar uma nova branch a partir da `main` do *seu fork* (usando o padrão `feature/` ou `fix/`).
3.  **Trabalhar:** Fazer commits locais na sua branch.
4.  **Sincronizar de Novo:** Atualizar a sua *feature branch* com as últimas mudanças da `main` do *repositório principal* (usando `rebase`).
5.  **Enviar (Push):** Fazer `push` da sua branch para o *seu fork* (`origin`).
6.  **Abrir PR:** Abrir um Pull Request do `seu-fork/feature-branch` para o `repositorio-principal/main`.

---

## 1. Fluxo de Trabalho (Linha de Comando - CLI)

Siga estes passos para cada nova tarefa ou correção.

### 1.0 Setup Inicial (Feito Apenas Uma Vez)

1.  **Fork:** No GitHub, clique no botão "Fork" na página do repositório principal.
2.  **Clone:** Clone o *seu fork* para o seu computador:
    ```bash
    git clone [URL_DO_SEU_FORK.git]
    ```
3.  **Adicione o `upstream`:** Entre na pasta e adicione o repositório principal como um "remote" chamado `upstream`:
    ```bash
    cd [nome-do-projeto]
    git remote add upstream [URL_DO_REPOSITORIO_PRINCIPAL.git]
    ```

### 1.1 Sincronizar e Criar a Branch

1.  Primeiro, garanta que a `main` do seu fork local está sincronizada com a `main` principal (`upstream`):
    ```bash
    git checkout main
    git fetch upstream
    git rebase upstream/main
    git push origin main
    ```
    *(Isto atualiza sua `main` local com o `upstream` e depois atualiza a `main` do seu fork no GitHub)*

2.  Agora, crie sua nova branch a partir da `main` atualizada (seguindo o padrão explicado na Seção 0):
    ```bash
    # Exemplo para feature:
    git checkout -b feature/autenticacao-jwt
    
    # Exemplo para correção:
    git checkout -b fix/bug-calculo-preco
    ```

### 1.2 Trabalhar: Fazer Commits Locais

1.  Faça o seu trabalho (crie/edite **arquivos**).
2.  Adicione os **arquivos** que deseja "commitar":
    ```bash
    git add .
    ```
3.  Faça o commit local com uma mensagem clara:
    ```bash
    git commit -m "feat: implementa endpoint de login"
    ```
4.  Repita os passos 1-3 quantas vezes forem necessárias.

### 1.3 Enviar para o Repositório Remoto (Com Segurança)

1.  **Sincronize com o `upstream`:** Antes de fazer o push, atualize sua branch com as últimas mudanças da `main` principal.
    ```bash
    # 1. Busca as atualizações do repositório principal
    git fetch upstream

    # 2. Aplica as suas alterações por cima das atualizações da main principal
    git rebase upstream/main
    ```
2.  **Resolva Conflitos (Se houver):** Se o `rebase` parar, o terminal avisará. Abra os **arquivos** indicados no VS Code, resolva os conflitos, salve o **arquivo** e continue:
    ```bash
    git add .
    git rebase --continue
    ```
3.  **Envie (Push) para o SEU FORK (`origin`):**
    * Se for o **primeiro push** desta branch:
        ```bash
        git push -u origin feature/autenticacao-jwt
        ```
    * Para **pushes seguintes** (ou se fez `rebase`):
        ```bash
        git push --force-with-lease
        ```

### 1.4 Verificando a sua Branch

* **Como saber em qual branch você está?**
    Antes de fazer `commit` ou `push`, digite `git status` no terminal. A primeira linha da resposta será `On branch [nome-da-sua-branch]`. Você também pode usar `git branch`, que listará todas as branches locais e marcará a atual com um asterisco (`*`).

---

## Próximo Passo

Após enviar sua branch para o **seu fork** (`origin`), vá até a página do **repositório principal** (`upstream`) no GitHub. Você verá um aviso amarelo com um botão para **"Compare & pull request"**.

Clique nele, escreva uma boa descrição e envie seu PR. O mantenedor será notificado para revisar seu código.
