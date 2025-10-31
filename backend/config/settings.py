from pathlib import Path
from datetime import timedelta


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-0)^=tg@i*c0z(=(2o%8x$3pg2md6%^^s47q#j*q3%xaljivfnm'

DEBUG = True

ALLOWED_HOSTS = []



INSTALLED_APPS = [
    'rest_framework_simplejwt',
    'rest_framework',
    'corsheaders',
    'api',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}



AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
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

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True



STATIC_URL = 'static/'



DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
