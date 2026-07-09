import os
import dj_database_url
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

# Ensure log directory exists for the file handler configured below.
_LOGS_DIR = Path(os.getenv("HRMM_LOGS_DIR", BASE_DIR / "logs"))
try:
    _LOGS_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    pass

# SECRET_KEY: Required in production (production.py enforces this).
# local.py provides a dev-only fallback so manage.py works without .env.
SECRET_KEY = os.getenv("SECRET_KEY", "")

DEBUG = os.getenv("DEBUG", "False") == "True"

_allowed = os.getenv("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [h.strip() for h in _allowed.split(",") if h.strip()] if _allowed else []

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
    "apps.aida",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
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
        "OPTIONS": {"min_length": 12},
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
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "20/minute",
        "user": "200/minute",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "HRMM API",
    "DESCRIPTION": "Hierarchical Report Management Module backend API",
    "VERSION": "1.0.0",
    "COMPONENT_SPLIT_REQUEST": True,
    "SECURITY": [{"jwtAuth": []}],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
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

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

# CORS_ALLOWED_ORIGINS: sourced from env var for production; local.py adds dev origins.
_cors_raw = os.getenv("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _cors_raw.split(",")
    if origin.strip().startswith(("http://", "https://"))
] if _cors_raw else []
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

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": _LOGS_DIR / "hrmm.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
        },
        "hrmm": {
            "handlers": ["console", "file"],
            "level": "INFO",
        },
    },
}

# ---------------------------------------------------------------------------
# Upload size limits — protect server memory from oversized payloads.
# ---------------------------------------------------------------------------

# Files smaller than this are kept in memory; larger ones are streamed to disk.
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv("FILE_UPLOAD_MAX_MEMORY_SIZE", str(2 * 1024 * 1024)))  # 2 MB

# Hard ceiling for the total size of any request body (covers all upload fields).
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv("DATA_UPLOAD_MAX_MEMORY_SIZE", str(20 * 1024 * 1024)))  # 20 MB

# Number of fields a single request can carry (Django default is 1000).
DATA_UPLOAD_MAX_NUMBER_FIELDS = int(os.getenv("DATA_UPLOAD_MAX_NUMBER_FIELDS", "1000"))

# ---------------------------------------------------------------------------
# AIDA AI Assistant — OpenRouter (bepul modellar)
# ---------------------------------------------------------------------------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
AIDA_MODEL = os.getenv("AIDA_MODEL", "meta-llama/llama-3.1-8b-instruct")
AIDA_MAX_TOKENS = int(os.getenv("AIDA_MAX_TOKENS", "1024"))
AIDA_TEMPERATURE = float(os.getenv("AIDA_TEMPERATURE", "0.7"))
AIDA_MAX_HISTORY = int(os.getenv("AIDA_MAX_HISTORY", "20"))
