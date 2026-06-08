import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-secret-key")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = ['*']

# --- APP CONFIGURATION ---
INSTALLED_APPS = [
    # Django mandatory apps
    "django.contrib.admin",           
    "django.contrib.auth",           
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # Third party apps
    "rest_framework",
    "rest_framework_simplejwt",       
    "rest_framework_simplejwt.token_blacklist", 

    # Local apps
    "apps.users.apps.UsersConfig",                    
    # Management (admin REST API)
    "apps.management.apps.ManagementConfig",
]

# --- AUTHENTICATION ---
AUTH_USER_MODEL = 'users.User' 

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# --- REST FRAMEWORK & JWT ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': os.getenv("JWT_ALGORITHM", "HS256"),
    'SIGNING_KEY': os.getenv("JWT_SECRET_KEY", SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# --- DATABASE ---
def _build_database_config() -> dict:
    return {
        "ENGINE": os.getenv("MYSQL_ENGINE", "django.db.backends.mysql"),
        "NAME": os.getenv("DB_NAME", "user-db"),
        "USER": os.getenv("DB_USER", "user_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", "123456"),
        "HOST": os.getenv("DB_HOST", "user-db"),     
        "PORT": os.getenv("DB_PORT", "3306"),           
    
        "CONN_MAX_AGE": int(os.getenv("CONN_MAX_AGE", 600)),                            # Max connection age 10 min
        "ATOMIC_REQUESTS": False,                       # Handle transactions per-request
        "OPTIONS": {
            "charset": "utf8mb4",
            "init_command": "SET NAMES 'utf8mb4'",
        },
    }

DATABASES = {"default": _build_database_config()}

# --- CLOUDINARY ---
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')

# --- MIDDLEWARE & OTHERS ---
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# --- TEMPLATES ---
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"