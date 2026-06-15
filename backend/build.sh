#!/usr/bin/env bash
# Sair imediatamente em caso de erro
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Verifica se os estáticos do admin foram copiados corretamente
echo "=== Verificando estáticos coletados ==="
if [ -d "staticfiles/admin/css" ]; then
    echo "OK: Estáticos do admin encontrados."
    ls staticfiles/admin/css/ | head -5
else
    echo "ERRO: Estáticos do admin NAO foram copiados!"
    exit 1
fi

python manage.py migrate

# Cria o superusuário automaticamente usando as variáveis do Render
if [ "$DJANGO_SUPERUSER_USERNAME" ]; then
  python manage.py createsuperuser --no-input || true
fi