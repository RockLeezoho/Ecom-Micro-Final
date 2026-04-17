import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


# ======================
# CORE CONFIG
# ======================
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["*"]


# ======================
# APPLICATIONS
# ======================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # DRF
    "rest_framework",

    # CORS
    "corsheaders",
]


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]


# ======================
# CORS (FRONTEND REACT)
# ======================
CORS_ALLOW_ALL_ORIGINS = True


# ======================
# URL CONFIG
# ======================
ROOT_URLCONF = "api_gateway.urls"


# ======================
# DATABASE (GATEWAY usually NO DB)
# ======================
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# ======================
# MICROSERVICE URLS
# ======================
SERVICE_URLS = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:8001"),
    "product": os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8002"),
    "cart": os.getenv("CART_SERVICE_URL", "http://localhost:8003"),
    "order": os.getenv("ORDER_SERVICE_URL", "http://localhost:8004"),
    "payment": os.getenv("PAYMENT_SERVICE_URL", "http://localhost:8005"),
    "review": os.getenv("REVIEW_SERVICE_URL", "http://localhost:8006"),
    "ai": os.getenv("AI_SERVICE_URL", "http://localhost:8007"),
}


# ======================
# REDIS (CACHE / CART / SESSION)
# ======================
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


# ======================
# JWT AUTH (for gateway auth forwarding)
# ======================
JWT_SECRET = os.getenv("JWT_SECRET", "jwt-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60


# ======================
# API VERSIONING
# ======================
API_VERSION = "v1"
API_BASE_PATH = f"/api/{API_VERSION}"


# ======================
# LOGGING
# ======================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}