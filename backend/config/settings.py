from pathlib import Path
import os
import sys
from datetime import timedelta
from dotenv import load_dotenv 
from decouple import config
import dj_database_url
import cloudinary
import cloudinary.uploader
import cloudinary.api

# 1. DIRETÓRIOS BASE
BASE_DIR = Path(__file__).resolve().parent.parent

# Carrega o arquivo .env em ambiente de desenvolvimento local
load_dotenv()

# 2. DIRETRIZES DE SEGURANÇA E AMBIENTE
SECRET_KEY = os.getenv('SECRET_KEY')

if not SECRET_KEY:
    if 'RENDER' in os.environ:
        raise ValueError("Faltou configurar a SECRET_KEY no painel do Render!")
    SECRET_KEY = 'chave-padrao-caso-falhe-em-desenvolvimento'

DEBUG = 'RENDER' not in os.environ

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

CSRF_TRUSTED_ORIGINS = [
    "https://confiaplus-api.onrender.com",
    "https://confia-mais.onrender.com",
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# 3. APLICATIVOS INSTALADOS
# ATENÇÃO: django.contrib.admin deve vir antes do cloudinary_storage
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework_simplejwt',
    'rest_framework',
    'corsheaders',
    'cloudinary_storage',
    'cloudinary',
    'django_rest_passwordreset',
    'api',
    'usuarios',
    'servicos',
    'financeiro',
    'agendamentos',
    'iot.apps.IotConfig',
]

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET')
}

# Cloudinary APENAS para arquivos de mídia (uploads de usuário)
# Arquivos estáticos ficam com WhiteNoise
DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# 4. MIDDLEWARES
# ATENÇÃO: SecurityMiddleware deve ser o 1º, WhiteNoise imediatamente após
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
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
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'Authorization',
    'Content-Type',
]


# 6. BANCO DE DADOS
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/confiaplus'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}


# 7. VALIDADORES DE SENHA
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


# 9. LOCALIZAÇÃO
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = False

AUTH_USER_MODEL = 'usuarios.Usuario'


# 10. ARQUIVOS ESTÁTICOS (WhiteNoise) E MÍDIA (Cloudinary)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = []  # sem diretórios extras; evita conflito

# WhiteNoise serve os estáticos em produção com compressão e cache
# Definido fora do bloco if DEBUG para garantir que sempre seja aplicado
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# 11. CONFIGURAÇÃO DE E-MAIL
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
BREVO_API_KEY = os.getenv('BREVO_API_KEY')

EMAIL_HOST_USER = os.getenv('EMAIL_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_PASSWORD')
DEFAULT_FROM_EMAIL = f'Equipe Confia + <{EMAIL_HOST_USER}>'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# 12. LOGS
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'rest_framework': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# ==========================================
# CONFIGURAÇÃO EXCLUSIVA PARA TESTES
# ==========================================
# Se o comando executado for o Pytest, forçamos o uso do SQLite local
# para não poluir nem travar no banco de dados da nuvem.

if 'pytest' in sys.modules or 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db_test.sqlite3',
        }
    }