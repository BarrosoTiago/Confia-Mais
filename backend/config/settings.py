from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv 
from decouple import config
import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()

# Substitua a linha antiga por esta:
SECRET_KEY = os.getenv('SECRET_KEY')

# Dica de segurança: Se por acaso o .env falhar, o Django não inicia (o que é bom)
if not SECRET_KEY:
    raise ValueError("Faltou configurar a SECRET_KEY no arquivo .env!")

DEBUG = True

ALLOWED_HOSTS = []



INSTALLED_APPS = [
    'rest_framework_simplejwt',
    'rest_framework',
    'corsheaders',
    'api',
    'usuarios',
    'servicos',
    'financeiro',
    'agendamentos',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_rest_passwordreset',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
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

# Configuração do CORS
CORS_ALLOW_ALL_ORIGINS = False # Por segurança, não deixe True em produção

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Permite que os cookies (como nosso refresh_token HttpOnly)
CORS_ALLOW_CREDENTIALS = True 

CORS_ALLOW_HEADERS = [
    'Authorization',
    'Content-Type',
]

#DATABASES = {
#    'default': {
#        'ENGINE': 'django.db.backends.sqlite3',
#        'NAME': BASE_DIR / 'db.sqlite3',
#    }
#}

# Nova Configuração (PostgreSQL - Neon)
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8, # Exige no mínimo 8 caracteres
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Configuração do Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Informa ao DRF para usar JWT para autenticação
        'rest_framework_simplejwt.authentication.JWTAuthentication',

        # Habilita login via Sessão (para VOCÊ testar no navegador agora)
        'rest_framework.authentication.SessionAuthentication',
    ),
    # ... (outras configurações do DRF)
}

# Configuração do Simple JWT

SIMPLE_JWT = {
    # Define o tempo de vida do Access Token (curto)
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    
    # Define o tempo de vida do Refresh Token (longo)
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    
    # Permite a rotação de Refresh Tokens (mais seguro)
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True, # Invalida o token antigo
    
    # Define o prefixo do cabeçalho de autorização (ex: "Bearer <token>")
    "AUTH_HEADER_TYPES": ("Bearer",),
}



LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = False

# Substituindo o model de usuário padrão
AUTH_USER_MODEL = 'usuarios.Usuario'

STATIC_URL = 'static/'

# CONFIGURAÇÃO DE E-MAIL (PROTEGIDA)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# O getenv busca o valor lá no arquivo .env. Se não achar, retorna None.
EMAIL_HOST_USER = os.getenv('EMAIL_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = f'Equipe Confia + <{EMAIL_HOST_USER}>'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'chave-padrao-caso-falhe')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG') == 'True'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Configuração de Mídia (Uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
