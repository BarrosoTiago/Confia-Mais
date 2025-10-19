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

# NOTAS

**Nota:** O app `api` atualmente contém um modelo `Tarefa` como prova de conceito para validar a comunicação entre Django e React. Este modelo deve ser substituído pela lógica de negócio real do ERP (ex: Produtos, Finanças, etc.), entre outras partes do backend que ainda não foram desenvolvidas.

Certo. Adicionar essas explicações conceituais na seção 0 é uma excelente ideia. Isso vai solidificar a importância das boas práticas que vêm depois.

Aqui está o `README.md` atualizado com as novas explicações:

-----

## Como Contribuir (Metodologia GitHub Flow)

Este projeto utiliza o **GitHub Flow**, uma metodologia de trabalho simples e poderosa. Siga este guia para garantir que o processo de contribuição seja organizado.

### 0\. Informações Essenciais

  * **Branch `main`:** É a nossa branch principal. Ela **DEVE** estar sempre funcional. Todo o código na `main` é considerado "em produção". **NINGUÉM** deve enviar código (fazer *push*) diretamente para ela.
  * **Branch (Ramificação):** É uma cópia isolada do projeto onde você pode trabalhar em uma nova funcionalidade (`feature`) ou corrigir um bug (`fix`) sem afetar a `main`. Sempre crie uma nova branch para *cada* tarefa.
  * **Pull Request (PR):** É um "Pedido de Integração". Quando você termina seu trabalho na sua branch, você abre um Pull Request. Isso notifica a equipe para que seu código seja revisado, discutido e, se aprovado, integrado (feito *merge*) à branch `main`.
  * **Por que sincronizar (`pull`/`fetch`) antes de enviar?**
    Para evitar conflitos. Pense assim: a `main` pode ter recebido código novo de outros colegas *enquanto* você trabalhava na sua branch. Trazer essas atualizações para a sua branch *antes* de fazer o `push` permite que *você* resolva qualquer conflito no seu computador local. Isso garante que sua contribuição se integre perfeitamente à `main` quando o PR for aprovado.
  * **O que o `Rebase` faz?**
    É a nossa forma preferida de sincronizar. Em vez de *misturar* os históricos com um "commit de merge" (que polui o histórico), o `rebase` faz algo mais inteligente: ele pega os *seus* commits, coloca-os de lado temporariamente, atualiza sua branch com o código mais recente da `main` e, em seguida, "re-aplica" os seus commits, um por um, *no topo* do histórico. O resultado é um histórico de commits limpo e linear (uma linha reta), que é muito mais fácil de ler e manter.

**O Fluxo de Trabalho é:**

1.  **Sincronizar:** Atualizar a sua `main` local.
2.  **Criar:** Criar uma nova branch a partir da `main`.
3.  **Trabalhar:** Fazer *commits* locais na sua branch.
4.  **Sincronizar de Novo:** Atualizar a sua branch com quaisquer mudanças da `main` (usando `rebase`) para evitar conflitos.
5.  **Enviar:** Fazer *push* da sua branch para o GitHub.
6.  **Abrir PR:** Abrir um Pull Request.

-----

### 1\. Como Criar uma Branch (Interface do VS Code)

Este é o método recomendado se você prefere a interface gráfica.

#### 1.1 Sincronizar e Criar a Branch

1.  **Mude para a `main`:** Clique no nome da branch no canto inferior esquerdo e selecione `main` na lista.
2.  **Atualize a `main`:** Clique no ícone de "Sincronizar Alterações" (as duas setas 🔄 ou uma nuvem ☁️) no canto inferior esquerdo. Isto executa um `git pull` e garante que tem o código mais recente.
3.  **Crie a Nova Branch:** Clique novamente no nome da branch (`main`).
4.  Selecione a opção **`+ Criar nova branch...`**.
5.  Digite um nome descritivo para sua branch.
      * *Padrão recomendado:* `feature/nome-da-tarefa` (para novas funções) ou `fix/nome-do-bug` (para correções).
      * *Exemplo:* `feature/autenticacao-jwt`
6.  Pressione Enter.

#### 1.2 Trabalhar: Fazer Commits Locais

1.  Faça o seu trabalho (crie/edite ficheiros).
2.  Vá ao painel **Source Control** (Controle de Versão) ⎇ na barra lateral.
3.  Os seus ficheiros modificados aparecerão em "Alterações".
4.  Escreva uma mensagem de *commit* clara e descritiva na caixa de texto no topo (ex: `feat: adiciona modelo de utilizador`).
5.  Clique no ícone de "Confirmar" (✔️) para fazer o *commit* local. Pode repetir este passo quantas vezes precisar.

#### 1.3 Enviar para o Repositório Remoto (Com Segurança)

1.  **Sincronize ANTES de enviar:** É uma boa prática atualizar a sua branch com as últimas mudanças da `main` *antes* de fazer o *push*, para resolver conflitos localmente.
      * Mude para a branch `main` (passo 1.1) e clique em "Sincronizar Alterações".
      * Mude de volta para a sua *feature branch*.
      * Clique na seta para baixo ao lado do nome da branch no canto inferior esquerdo e selecione `Branch > Rebase Branch...` (Rebase de Branch).
      * Escolha `main` na lista. Isto aplica as suas alterações "por cima" das atualizações da `main`, mantendo um histórico limpo. (Se houver conflitos, o VS Code irá guiá-lo para resolvê-los).
2.  **Envie (Push):** Após o *rebase* (ou se for o primeiro *push*), clique no ícone de "Publicar Branch" (a nuvem ☁️) no canto inferior esquerdo.

#### 1.4 Verificando a sua Branch

  * **Como saber em qual branch você está?**
    Basta olhar no **canto inferior esquerdo** da janela do VS Code. O nome exibido ali é a branch em que você está no momento. Verifique se é o nome da sua *feature branch* (ex: `feature/autenticacao-jwt`) e não a `main`.

-----

### 2\. Como Criar uma Branch (Linha de Comando - CLI)

Para quem prefere usar o terminal integrado do VS Code (`Ctrl + '` ou `Cmd + '`).

#### 2.1 Sincronizar e Criar a Branch

1.  Primeiro, garanta que a sua `main` local está atualizada com a do repositório remoto:
    ```bash
    git checkout main
    git pull origin main
    ```
2.  Agora, crie e mude para a sua nova branch com um único comando:
    ```bash
    # Use o padrão feature/ ou fix/
    git checkout -b feature/nome-da-tarefa
    ```
      * *Exemplo:* `git checkout -b feature/autenticacao-jwt`

#### 2.2 Trabalhar: Fazer Commits Locais

1.  Faça o seu trabalho (crie/edite ficheiros).
2.  Adicione os ficheiros que deseja "commitar":
    ```bash
    git add .  # O "." adiciona todos os ficheiros modificados
    ```
3.  Faça o *commit* local com uma mensagem clara:
    ```bash
    git commit -m "feat: implementa endpoint de login"
    ```
4.  Pode repetir os passos 2 e 3 quantas vezes forem necessárias.

#### 2.3 Enviar para o Repositório Remoto (Com Segurança)

Esta é a melhor prática para evitar conflitos e manter o histórico limpo.

1.  **Sincronize com a `main`:** Antes de fazer o *push*, atualize a sua branch com as últimas mudanças da `main`. Usamos `rebase` para isto:
    ```bash
    # 1. Busca as atualizações do repositório
    git fetch origin

    # 2. Aplica as suas alterações por cima das atualizações da main
    git rebase origin/main
    ```
2.  **Resolva Conflitos (Se houver):** Se o `rebase` parar devido a um conflito, o terminal avisará. Abra os ficheiros indicados no VS Code, resolva os conflitos (o editor mostrará opções como "Accept Current Change", "Accept Incoming Change"), salve o ficheiro e continue:
    ```bash
    git add .  # Adiciona os ficheiros resolvidos
    git rebase --continue
    ```
3.  **Envie (Push):**
      * Se for o **primeiro push** desta branch:
        ```bash
        git push -u origin feature/nome-da-tarefa
        ```
      * Para **pushes seguintes** (ou se fez `rebase`):
        ```bash
        git push
        ```
          * *Nota:* Se fez um `rebase` numa branch que *já* existia no remoto, pode precisar forçar o push: `git push --force-with-lease`. Faça isto com cuidado.

#### 2.4 Verificando a sua Branch

  * **Como saber em qual branch você está?**
    Antes de fazer `commit` ou `push`, digite `git status` no terminal. A primeira linha da resposta será `On branch [nome-da-sua-branch]`. Você também pode usar `git branch`, que listará todas as branches locais e marcará a atual com um asterisco (`*`).

-----

### Próximo Passo

Após verificar que está na branch correta e enviar as suas alterações, vá até a página do repositório no GitHub. Você verá um aviso amarelo com um botão para **"Compare & pull request"**. Clique nele para iniciar a revisão do seu código.