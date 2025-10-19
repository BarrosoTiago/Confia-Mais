# Projeto ERP - Backend (Django)

Este é o repositório backend do projeto ERP, construído com Django e Django REST Framework.

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

5.  **Rode o servidor de desenvolvimento**
    ```bash
    python manage.py runserver
    ```

O servidor estará disponível em `http://127.0.0.1:8000/`.

---

# NOTAS

**Nota:** O app `api` atualmente contém um modelo `Tarefa` como prova de conceito para validar a comunicação entre Django e React. Este modelo deve ser substituído pela lógica de negócio real do ERP (ex: Produtos, Finanças, etc.), entre outras partes do backend que ainda não foram desenvolvidas.