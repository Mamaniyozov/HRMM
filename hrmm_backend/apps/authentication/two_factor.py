import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote

from django.conf import settings
from django.core import signing


TOTP_PERIOD_SECONDS = 30
TOTP_DIGITS = 6
LOGIN_CHALLENGE_MAX_AGE_SECONDS = 300
LOGIN_CHALLENGE_SALT = "hrmm-auth-2fa-login"


def generate_totp_secret():
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _normalize_secret(secret):
    value = "".join(str(secret or "").strip().upper().split())
    if not value:
        raise ValueError("TOTP secret is empty.")
    padding = "=" * ((8 - (len(value) % 8)) % 8)
    return base64.b32decode(f"{value}{padding}", casefold=True)


def _hotp(secret, counter, digits=TOTP_DIGITS):
    secret_bytes = _normalize_secret(secret)
    counter_bytes = struct.pack(">Q", counter)
    digest = hmac.new(secret_bytes, counter_bytes, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(binary % (10**digits)).zfill(digits)


def get_totp(secret, for_time=None):
    timestamp = int(for_time or time.time())
    counter = timestamp // TOTP_PERIOD_SECONDS
    return _hotp(secret, counter)


def verify_totp(secret, code, *, at_time=None, window=1):
    normalized_code = str(code or "").strip()
    if not normalized_code.isdigit() or len(normalized_code) != TOTP_DIGITS:
        return False

    timestamp = int(at_time or time.time())
    counter = timestamp // TOTP_PERIOD_SECONDS
    for offset in range(-window, window + 1):
        candidate = _hotp(secret, counter + offset)
        if hmac.compare_digest(candidate, normalized_code):
            return True
    return False


def build_otpauth_url(user):
    issuer = getattr(settings, "TOTP_ISSUER_NAME", "HRMM Control Center")
    label = quote(f"{issuer}:{user.username}")
    issuer_encoded = quote(issuer)
    return (
        f"otpauth://totp/{label}?secret={user.totp_secret}"
        f"&issuer={issuer_encoded}&algorithm=SHA1&digits={TOTP_DIGITS}&period={TOTP_PERIOD_SECONDS}"
    )


def build_qr_code_url(otpauth_url):
    return f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={quote(otpauth_url, safe='')}"


def build_login_challenge(user):
    return signing.dumps({"user_id": str(user.id)}, salt=LOGIN_CHALLENGE_SALT)


def read_login_challenge(challenge_token):
    return signing.loads(
        challenge_token,
        salt=LOGIN_CHALLENGE_SALT,
        max_age=LOGIN_CHALLENGE_MAX_AGE_SECONDS,
    )
