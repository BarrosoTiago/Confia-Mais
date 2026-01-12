# Projeto ERP - CONFIA +

## O que é um ERP?
Um **ERP (Enterprise Resource Planning)** é um **sistema de gestão financeira empresarial** que reúne, em uma única plataforma, os principais processos de uma organização — como finanças, vendas, serviços e recursos humanos — permitindo que todos os setores compartilhem informações em tempo real e trabalhem de forma mais eficiente e centralizada.

## O que é o Confia +?
UM **ERP** simplificado, de tamanho reduzido e disponível na web, com o foco nas necessidades de microempreendedores e prestadores de serviços.

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

<br>

# NOTAS

**Nota:** O app `api` atualmente contém um modelo `Tarefa` como prova de conceito para validar a comunicação entre Django e React. Este modelo deve ser substituído pela lógica de negócio real do ERP (ex: Produtos, Finanças, etc.), entre outras partes do backend que ainda não foram desenvolvidas.

Certo. Adicionar essas explicações conceituais na seção 0 é uma excelente ideia. Isso vai solidificar a importância das boas práticas que vêm depois.

Aqui está o `README.md` atualizado com as novas explicações:

-----
<br>
<br>

# Como Contribuir (Metodologia Fork & Pull Request)

Este projeto utiliza um fluxo de trabalho baseado em **Forks** e **Linha de Comando (CLI)**. Siga este guia para garantir que o processo de contribuição seja organizado e padronizado.

## 0. Informações Essenciais

**Repositórios:**
* **Repositório Principal (`upstream`):** É o repositório central do projeto (o que está no perfil do dono). É para onde seu código será enviado no final.
* **Seu Fork (`origin`):** É uma cópia pessoal sua do repositório principal, que fica no seu perfil do GitHub. É aqui que você tem permissão de escrita e onde você enviará suas branches de trabalho.

**Conceitos:**
* **Branch `main`:** A branch principal *do repositório principal* (`upstream`). Ela DEVE estar sempre funcional.
* **Branch (Ramificação):** É uma cópia isolada do projeto *no seu fork* onde você trabalha em uma tarefa.
* **Padrão de Nomes de Branch:** Usamos prefixos claros para organizar o trabalho:
    * `feature/`: Para adicionar uma nova funcionalidade (ex: `feature/login-jwt`).
    * `fix/`: Para corrigir um bug (ex: `fix/bug-calculo-estoque`).
    * **Porquê?** Isso torna o histórico do projeto legível. Com uma rápida olhada, qualquer pessoa da equipe sabe o *propósito* daquela branch.
* **Pull Request (PR):** É um "Pedido de Integração". Quando você termina seu trabalho *no seu fork*, você abre um Pull Request. **Importante:** O PR *não* mescla seu código na `main` automaticamente. Ele é a forma de "enviar" sua branch de feature para o repositório principal para que ela possa ser revisada, testada e discutida pela equipe.
* **Por que sincronizar?** Para evitar conflitos. A `main` do repositório principal (`upstream`) pode ter recebido código novo de outros colegas *enquanto* você trabalhava. Trazer essas atualizações para a sua branch *antes* de abrir o PR permite que *você* resolva qualquer conflito localmente.
* **Sincronizando com `Merge`:** Para manter o histórico simples, vamos usar `git merge` (e não `rebase`). Ao sincronizar, você trará o estado atual da `main` *para dentro* da sua branch de feature. Isso pode criar um "commit de merge", o que é perfeitamente normal neste fluxo.

**O Fluxo de Trabalho é:**
1.  **Sincronizar Fork:** Atualizar a `main` do *seu fork* com a `main` do *repositório principal*.
2.  **Criar Branch:** Criar uma nova branch a partir da `main` do *seu fork* (usando o padrão `feature/` ou `fix/`).
3.  **Trabalhar:** Fazer commits locais na sua branch.
4.  **Testar:** Garantir que sua feature funciona como esperado e não quebra o resto do projeto.
5.  **Sincronizar de Novo:** Atualizar a sua *feature branch* com as últimas mudanças da `main` do *repositório principal* (usando `merge`).
6.  **Enviar (Push):** Fazer `push` da sua branch para o *seu fork* (`origin`).
7.  **Abrir PR:** Abrir um Pull Request do `seu-fork/feature-branch` para o `repositorio-principal/main`.

---

## 1. Fluxo de Trabalho (Linha de Comando - CLI)

Siga estes passos para cada nova tarefa ou correção.

### 1.0 Setup Inicial (Feito Apenas Uma Vez)

O objetivo aqui é preparar o seu computador local para trabalhar com os dois repositórios (o seu fork e o principal).

1.  **Fork:** No GitHub, clique no botão "Fork" na página do repositório principal.

2.  **Clone:** Clone o *seu fork* para o seu computador:
    ```bash
    git clone [URL_DO_SEU_FORK.git]
    ```
    > **O que faz:** Baixa (clona) o *seu fork* (cópia pessoal) do GitHub para o seu computador. Você começa com o seu fork porque é nele que você tem permissão de escrita.

3.  **Adicione o `upstream`:** Entre na pasta e adicione o repositório principal como um "remote" chamado `upstream`:
    ```bash
    cd [nome-do-projeto]
    ```
    > **O que faz:** Entra na pasta do projeto que acabou de ser baixada.
    
    ```bash
    git remote add upstream [URL_DO_REPOSITORIO_PRINCIPAL.git]
    ```
    > **O que faz:** Adiciona um "apelido" (um "remote") chamado `upstream` que aponta para o repositório principal. Agora, seu Git local conhece dois remotos:
    > * `origin`: O seu fork (para onde você **envia** seu trabalho - `push`).
    > * `upstream`: O repositório principal (de onde você **busca** atualizações - `fetch`/`merge`).

### 1.1 Sincronizar e Criar a Branch

O objetivo aqui é garantir que você está começando sua nova tarefa a partir do código mais atualizado do projeto principal.

1.  Primeiro, garanta que a `main` do seu fork local está sincronizada com a `main` principal (`upstream`):
    ```bash
    git checkout main
    ```
    > **O que faz:** Muda o seu foco para a sua branch `main` local.
    
    ```bash
    git fetch upstream
    ```
    > **O que faz:** Baixa todas as últimas "referências" (novos commits) do repositório *principal* (`upstream`). Ele **não** altera seus arquivos ainda, apenas "olha" o que há de novo.
    
    ```bash
    git merge upstream/main
    ```
    > **O que faz:** Pega as atualizações da `main` do `upstream` (que você acabou de baixar) e as "funde" (merge) na sua `main` local. Agora, a sua `main` local está 100% sincronizada.
    
    ```bash
    git push origin main
    ```
    > **O que faz:** Envia (push) a sua `main` local (agora atualizada) para a `main` do *seu fork* (`origin`). É uma boa prática para manter seu fork no GitHub também atualizado.

2.  Agora, crie sua nova branch a partir da `main` atualizada:
    ```bash
    # Exemplo para feature:
    git checkout -b feature/autenticacao-jwt
    
    # Exemplo para correção:
    git checkout -b fix/bug-calculo-preco
    ```
    > **O que faz:** Cria uma *nova* branch (o `-b` significa "branch") com o nome que você deu e imediatamente muda para ela. Seu trabalho agora está isolado nesta branch.

### 1.2 Trabalhar: Fazer Commits Locais

O objetivo é salvar seu progresso em pequenos passos lógicos.

1.  Faça o seu trabalho (crie/edite **arquivos**).

2.  Adicione os **arquivos** que deseja "commitar":
    ```bash
    git add .
    ```
    > **O que faz:** Pega todos os arquivos que você modificou ou criou e os coloca na "área de preparação" (stage). Você está dizendo ao Git: "Estes são os arquivos que eu quero salvar no próximo 'pacote'".

3.  Faça o commit local com uma mensagem clara:
    ```bash
    git commit -m "feat: implementa endpoint de login"
    ```
    > **O que faz:** Salva permanentemente (no seu histórico *local*) as mudanças que estavam em "stage", com uma mensagem descritiva.

4.  Repita os passos 1-3 quantas vezes forem necessárias.

### 1.3 Enviar para o Repositório Remoto (Com Segurança)

O objetivo aqui é enviar seu trabalho para o seu fork, mas **apenas depois** de garantir que ele não conflita com o que foi feito no repositório principal *enquanto* você trabalhava.

1.  **Sincronize com o `upstream`:**
    ```bash
    git fetch upstream
    ```
    > **O que faz:** (Repetido) Baixa as últimas referências do repositório principal.
    
    ```bash
    git merge upstream/main
    ```
    > **O que faz:** Pega as últimas atualizações da `main` do `upstream` e as "funde" (merge) na *sua branch de feature* atual.
    > **Por quê?** Este é o passo de segurança. Se alguém atualizou a `main` enquanto você trabalhava, você está trazendo essas atualizações para a *sua branch* e resolvendo os conflitos localmente, antes de criar o PR.

2.  **Resolva Conflitos (Se houver):**
    > Se o `merge` parar devido a um conflito, o terminal avisará. Abra os **arquivos** indicados no VS Code, resolva os conflitos, salve o **arquivo** e finalize o commit:
    ```bash
    git add .
    git commit
    ```
    > **O que faz:** O editor de texto abrirá para você confirmar a mensagem do "commit de merge", finalizando a resolução do conflito.

3.  **Envie (Push) para o SEU FORK (`origin`):**
    ```bash
    # Se for o primeiro push desta branch:
    git push -u origin feature/autenticacao-jwt
    ```
    > **O que faz:** Envia (push) a *sua branch de feature* para o *seu fork* (`origin`). O `-u` "conecta" a branch local à remota.
    
    ```bash
    # Para pushes seguintes:
    git push
    ```
    > **O que faz:** Envia quaisquer novos commits (incluindo o commit de merge, se houver) para o seu fork.

### 1.4 Verificando a sua Branch

* **Como saber em qual branch você está?**
    > Antes de fazer `commit` ou `push`, digite `git status` no terminal. A primeira linha da resposta será `On branch [nome-da-sua-branch]`. Você também pode usar `git branch`, que listará todas as branches locais e marcará a atual com um asterisco (`*`).

---

## Próximo Passo

Após enviar sua branch para o **seu fork** (`origin`), vá até a página do **repositório principal** (`upstream`) no GitHub. Você verá um aviso amarelo com um botão para **"Compare & pull request"**.

Clique nele, escreva uma boa descrição e envie seu PR. O repositório principal será notificado da sua contribuição e a equipe poderá revisar e testar sua branch.

Clique nele, escreva uma boa descrição e envie seu PR. O mantenedor será notificado para revisar seu código.






---

# OBSERVAÇÕES DE DESENVOLVIMENTO
> Para testar recuperação de senha localmente sem configurar e-mail, descomente a linha de (config/settings.py): EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend' e comente EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'. Para rodar com a chave, faça o contrário disto. No primeiro caso, o token de acesso será disponibilizado através do terminal do backend Django.

