import os
import dj_database_url
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

# JWT HS256 tavsiya qiladi: kamida 32 belgi. Productionda .env da uzun kalit qo'ying.
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-local-hrmm-dev-secret-key-32b")

DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_spectacular",
    "apps.authentication",
    "apps.users",
    "apps.departments",
    "apps.units",
    "apps.reports",
    "apps.workflows",
    "apps.leave_management",
    "apps.dashboard",
    "apps.audit",
    "apps.notifications",
    "apps.archives",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    #"django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

db_name = os.getenv("DB_NAME") or os.getenv("PGDATABASE")
db_user = os.getenv("DB_USER") or os.getenv("PGUSER")
db_password = os.getenv("DB_PASSWORD") or os.getenv("PGPASSWORD")
db_host = os.getenv("DB_HOST") or os.getenv("PGHOST")
db_port = os.getenv("DB_PORT") or os.getenv("PGPORT")
pg_connect_timeout = int(os.getenv("PG_CONNECT_TIMEOUT", "10"))

if all([db_name, db_user, db_password, db_host, db_port]):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": db_name,
            "USER": db_user,
            "PASSWORD": db_password,
            "HOST": db_host,
            "PORT": db_port,
            "OPTIONS": {"connect_timeout": pg_connect_timeout},
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "hrmm@example.com")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.authentication.auth.HRMMJWTAuthentication",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "HRMM API",
    "DESCRIPTION": "Hierarchical Report Management Module backend API",
    "VERSION": "1.0.0",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}


TOTP_ISSUER_NAME = os.getenv("TOTP_ISSUER_NAME", "HRMM Control Center")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

ARCHIVE_RETENTION_DAYS = int(os.getenv("ARCHIVE_RETENTION_DAYS", "7"))
ARCHIVE_OUTPUT_DIR = BASE_DIR / "archives"


def _env_csv_list(name, *, defaults=None):
    raw = os.getenv(name, "")
    values = [item.strip() for item in raw.split(",") if item.strip()]
    if values:
        return values
    return list(defaults or [])


ARCHIVE_MODELS = _env_csv_list(
    "ARCHIVE_MODELS",
    defaults=[
        "audit.AuditLog",
        "notifications.Notification",
        "workflows.ApprovalHistory",
    ],
)

_default_csrf_origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

_csrf_origins = [
    origin
    for origin in _env_csv_list("CSRF_TRUSTED_ORIGINS")
    if origin.startswith(("http://", "https://"))
]
CSRF_TRUSTED_ORIGINS = _csrf_origins or _default_csrf_origins
STATIC_ROOT = BASE_DIR / "staticfiles"

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
STATICFILES_DIRS = []
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

PG_CONNECT_TIMEOUT = int(os.getenv("PG_CONNECT_TIMEOUT", "5"))

database_url = os.getenv("DATABASE_URL")

if database_url:
    DATABASES = {
        "default": dj_database_url.parse(database_url, conn_max_age=600)
    }
    # ensure OPTIONS exists and set connect_timeout without direct TypedDict indexing
    opts = DATABASES["default"].setdefault("OPTIONS", {})
    opts["connect_timeout"] = PG_CONNECT_TIMEOUT
else:
    db_name = os.getenv("DB_NAME") or os.getenv("PGDATABASE")
    db_user = os.getenv("DB_USER") or os.getenv("PGUSER")
    db_password = os.getenv("DB_PASSWORD") or os.getenv("PGPASSWORD")
    db_host = os.getenv("DB_HOST") or os.getenv("PGHOST")
    db_port = os.getenv("DB_PORT") or os.getenv("PGPORT")

    if all([db_name, db_user, db_password, db_host, db_port]):
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": db_name,
                "USER": db_user,
                "PASSWORD": db_password,
                "HOST": db_host,
                "PORT": db_port,
            }
        }
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }
