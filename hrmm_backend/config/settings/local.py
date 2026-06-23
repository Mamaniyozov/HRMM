"""
Local development settings for HRMM.

Used by manage.py for local development. Provides safe defaults
so developers can run the app without any .env file.
"""

from .base import *  # noqa: F401,F403

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Dev-only SECRET_KEY — never used in production (production.py enforces env var).
SECRET_KEY = "django-insecure-local-hrmm-dev-only-key-not-for-production"

# CORS: allow common local development origins
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Use console email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"