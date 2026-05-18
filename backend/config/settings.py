from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv 
from decouple import config
import dj_database_url

# 1. DIRETÓRIOS BASE
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega o arquivo .env em ambiente de desenvolvimento local
load_dotenv()

# 2. DIRETRIZES DE SEGURANÇA E AMBIENTE (Unificadas para Produção/Render)
SECRET_KEY = os.getenv('SECRET_KEY')

# Dica de segurança mantida: se estiver local e sem chave, o sistema avisa.
# No Render, ele usará a chave definida nas Variáveis de Ambiente.
if not SECRET_KEY:
    if 'RENDER' in os.environ:
        raise ValueError("Faltou configurar a SECRET_KEY no painel do Render!")
    SECRET_KEY = 'chave-padrao-caso-falhe-em-desenvolvimento'

# O DEBUG se torna False automaticamente se o projeto estiver rodando no Render [cite: 807, 810]
DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = ['localhost', '127.0.0.1']
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME) 


# 3. APLICATIVOS INSTALADOS
INSTALLED_APPS = [
    'rest_framework_simplejwt',
    'rest_framework',
    'api',
    'usuarios',
    'servicos',
    'financeiro',
    'agendamentos',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_rest_passwordreset',
]

# 4. MIDDLEWARES (Com a inclusão estratégica do WhiteNoise para arquivos estáticos) [cite: 421]
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Inserido logo após o SecurityMiddleware [cite: 465, 466]
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# 5. CONFIGURAÇÃO DO CORS
CORS_ALLOW_ALL_ORIGINS = False 

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://confia-mais.onrender.com",
    
    # Quando criar o serviço do frontend no Render, adicione a URL dele aqui:
    # "https://confia-mais-frontend.onrender.com"
]

CORS_ALLOW_CREDENTIALS = True 

CORS_ALLOW_HEADERS = [
    'Authorization',
    'Content-Type',
]


# 6. BANCO DE DADOS (PostgreSQL adaptado para alternar entre local e nuvem) [cite: 420]
DATABASES = {
    'default': dj_database_url.config(
        # Lê a variável DATABASE_URL do Render; se não achar, usa o fallback local [cite: 430, 825]
        default=os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/confiaplus'), 
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# 7. VALIDATÓRIOS DE SENHA
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# 8. DJANGO REST FRAMEWORK & SIMPLE JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True, 
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# 9. LOCALIZAÇÃO E SUCURSAL DE USUÁRIO
LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = False

AUTH_USER_MODEL = 'usuarios.Usuario'


# 10. ARQUIVOS ESTÁTICOS E ARMAZENAMENTO EM PRODUÇÃO
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') 

# Ativa a compressão e cache otimizado do WhiteNoise em produção [cite: 485]
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' 

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# 11. CONFIGURAÇÃO DE E-MAIL (PROTEGIDA)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv('EMAIL_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = f'Equipe Confia + <{EMAIL_HOST_USER}>'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'