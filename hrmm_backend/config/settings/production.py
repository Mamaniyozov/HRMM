"""
Production settings for HRMM.

This module is used by wsgi.py / asgi.py (and therefore by gunicorn on Railway).
Every security-critical value is required from the environment — there are no
silent fallbacks that could leave production running with insecure defaults.
"""

import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403

# ---------------------------------------------------------------------------
# Core security
# ---------------------------------------------------------------------------

DEBUG = False

_secret = os.getenv("SECRET_KEY", "")
if not _secret:
    raise ImproperlyConfigured(
        "SECRET_KEY environment variable is required in production. "
        "Generate one with: python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
    )
SECRET_KEY = _secret

_hosts = os.getenv("ALLOWED_HOSTS", "")
if not _hosts or _hosts.strip() == "*":
    raise ImproperlyConfigured(
        "ALLOWED_HOSTS environment variable must be set to an explicit "
        "comma-separated list of hostnames in production (not '*')."
    )
ALLOWED_HOSTS = [h.strip() for h in _hosts.split(",") if h.strip()]

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

_cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in _cors_origins.split(",")
        if origin.strip().startswith(("http://", "https://"))
    ]
else:
    # If not set, fall back to CSRF_TRUSTED_ORIGINS (already configured in base.py)
    CORS_ALLOWED_ORIGINS = CSRF_TRUSTED_ORIGINS  # noqa: F405

# ---------------------------------------------------------------------------
# HTTPS / Security headers
# ---------------------------------------------------------------------------

SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True") == "True"
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ---------------------------------------------------------------------------
# Additional security headers
# ---------------------------------------------------------------------------

# Prevent MIME-type sniffing on responses.
SECURE_CONTENT_TYPE_NOSNIFF = True

# Enable browser XSS filtering on responses.
SECURE_BROWSER_XSS_FILTER = True

# Clickjacking protection — deny framing entirely (API + SPA, no embeds needed).
X_FRAME_OPTIONS = "DENY"

# Limit Referer header leakage to cross-origin requests.
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Cookie lifetime (in seconds) — keep sessions reasonably short.
SESSION_COOKIE_AGE = int(os.getenv("SESSION_COOKIE_AGE", str(60 * 60 * 8)))  # 8h
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SAMESITE = "Lax"

# ---------------------------------------------------------------------------
# Static files — WhiteNoise is already configured in base.py
# ---------------------------------------------------------------------------

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ---------------------------------------------------------------------------
# AIDA AI Assistant — provider-agnostic (Gemini / Anthropic)
# ---------------------------------------------------------------------------

_ai_provider = os.getenv("AI_PROVIDER", "gemini").lower()

if _ai_provider == "anthropic":
    _aida_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not _aida_key:
        raise ImproperlyConfigured(
            "AI_PROVIDER=anthropic bo'lganda ANTHROPIC_API_KEY majburiy. "
            "Kalitni https://console.anthropic.com/settings/keys dan oling va "
            "deployment platformangizning environment variables bo'limiga qo'ying."
        )
    ANTHROPIC_API_KEY = _aida_key
elif _ai_provider == "gemini":
    _aida_key = os.getenv("GEMINI_API_KEY", "")
    if not _aida_key:
        raise ImproperlyConfigured(
            "AI_PROVIDER=gemini bo'lganda GEMINI_API_KEY majburiy. "
            "Kalitni https://aistudio.google.com/apikey dan oling va "
            "deployment platformangizning environment variables bo'limiga qo'ying."
        )
    GEMINI_API_KEY = _aida_key
else:
    raise ImproperlyConfigured(
        f"Noto'g'ri AI_PROVIDER: {_ai_provider!r}. 'gemini' yoki 'anthropic' bo'lishi kerak."
    )
