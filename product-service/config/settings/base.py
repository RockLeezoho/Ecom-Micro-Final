import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'changeme')
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*']

# Django TEMPLATES setting (required for admin)
TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [BASE_DIR / 'templates'],
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

INSTALLED_APPS = [
	'django.contrib.admin',
	'django.contrib.auth',
	'django.contrib.contenttypes',
	'django.contrib.sessions',
	'django.contrib.messages',
	'django.contrib.staticfiles',
    'django_filters',
	'rest_framework',
    'modules.domain',          # ← Add
    'modules.application', 
	'modules.infrastructure',
	'modules.presentation',
]

MIDDLEWARE = [
	'django.middleware.security.SecurityMiddleware',
	'django.contrib.sessions.middleware.SessionMiddleware',
	'django.middleware.common.CommonMiddleware',
	'django.middleware.csrf.CsrfViewMiddleware',
	'django.contrib.auth.middleware.AuthenticationMiddleware',
	'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'config.urls'

REST_FRAMEWORK = {
	'DEFAULT_AUTHENTICATION_CLASSES': (
		'modules.presentation.api.authentication.InternalServiceAuthentication',
		'modules.presentation.api.authentication.JWTBearerAuthentication',
	),
	'DEFAULT_PERMISSION_CLASSES': (
		'rest_framework.permissions.IsAuthenticated',
	),
}

INTERNAL_SERVICE_TOKEN = os.getenv('INTERNAL_SERVICE_TOKEN', '')

DATABASES = {
	'default': {
		'ENGINE': os.getenv('POSTGRES_ENGINE', 'django.db.backends.postgresql'),
		# Pooler-first config: DB_* has priority, POSTGRES_* kept for compatibility.
		'NAME': os.getenv('DB_NAME', os.getenv('POSTGRES_DB', 'product-db')),
		'USER': os.getenv('DB_USER', os.getenv('POSTGRES_USER', 'product_user')),
		'PASSWORD': os.getenv('DB_PASSWORD', os.getenv('POSTGRES_PASSWORD', '123456')),
		'HOST': os.getenv('DB_HOST', os.getenv('POSTGRES_HOST', 'product-db')),
		'PORT': os.getenv('DB_PORT', os.getenv('POSTGRES_PORT', '5432')),
		'CONN_MAX_AGE': 600,
		'ATOMIC_REQUESTS': False,
	}
}
# Cloudinary config
CLOUDINARY = {
	'cloud_name': os.getenv('CLOUDINARY_CLOUD_NAME', ''),
	'api_key': os.getenv('CLOUDINARY_API_KEY', ''),
	'api_secret': os.getenv('CLOUDINARY_API_SECRET', ''),
}
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/1')
CACHES = {
	"default": {
		"BACKEND": "django_redis.cache.RedisCache",
		"LOCATION": REDIS_URL,
		"OPTIONS": {
			"CLIENT_CLASS": "django_redis.client.DefaultClient",
		}
	}
}

# gRPC service host config (for aggregator)
RECOMMENDATION_GRPC_HOST = os.getenv('RECOMMENDATION_GRPC_HOST', 'ai_service:50051')
ORDER_GRPC_HOST = os.getenv('ORDER_GRPC_HOST', 'order_service:50052')

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Ho_Chi_Minh'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
