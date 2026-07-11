import base64
import io
import secrets
from datetime import timedelta

from django.conf import settings
from django.core import signing
from django.utils import timezone

from .models import QRLoginChallenge


QR_LOGIN_CHALLENGE_MAX_AGE_SECONDS = 300
QR_LOGIN_CHALLENGE_SALT = "hrmm-auth-qr-login"


def _build_qr_login_token(user):
    return signing.dumps(
        {"user_id": str(user.id), "nonce": secrets.token_urlsafe(16)},
        salt=QR_LOGIN_CHALLENGE_SALT,
    )


def _read_qr_login_token(token):
    return signing.loads(
        token,
        salt=QR_LOGIN_CHALLENGE_SALT,
        max_age=QR_LOGIN_CHALLENGE_MAX_AGE_SECONDS,
    )


def _generate_short_token():
    """Generate a short, URL-safe token for QR codes."""
    return secrets.token_urlsafe(16).replace("-", "").replace("_", "")[:20]


def create_qr_login_challenge(user):
    QRLoginChallenge.objects.filter(
        user=user,
        status="PENDING",
        used_at__isnull=True,
    ).delete()

    token = _build_qr_login_token(user)
    short_token = _generate_short_token()
    challenge = QRLoginChallenge.objects.create(
        user=user,
        challenge_token=token,
        short_token=short_token,
        status="PENDING",
        expires_at=timezone.now() + timedelta(seconds=QR_LOGIN_CHALLENGE_MAX_AGE_SECONDS),
    )
    return challenge, token, short_token


def build_qr_login_data_uri(token, approve_url=None):
    try:
        import qrcode

        qr_content = approve_url or token
        img = qrcode.make(qr_content)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/png;base64,{b64}"
    except Exception:
        return ""


def get_pending_qr_challenge(token):
    """Resolve a challenge by either full challenge_token or short_token."""
    query = QRLoginChallenge.objects.filter(
        status="PENDING",
        used_at__isnull=True,
        expires_at__gt=timezone.now(),
    )
    challenge = (
        query.filter(challenge_token=token).select_related("user").first()
        or query.filter(short_token=token).select_related("user").first()
    )
    if not challenge:
        return None
    try:
        _read_qr_login_token(challenge.challenge_token)
    except (signing.BadSignature, signing.SignatureExpired):
        return None
    return challenge


def approve_qr_login_challenge(token, approved_by):
    challenge = get_pending_qr_challenge(token)
    if not challenge:
        return False, "QR login sessiyasi topilmadi yoki muddati tugagan."

    if challenge.user.id != approved_by.id:
        return False, "Faqat o'z hisobingizga kirishni tasdiqlashingiz mumkin."

    challenge.status = "APPROVED"
    challenge.approved_by = approved_by
    challenge.approved_at = timezone.now()
    challenge.save(update_fields=["status", "approved_by", "approved_at"])
    return True, None


def reject_qr_login_challenge(token):
    challenge = get_pending_qr_challenge(token)
    if not challenge:
        return False, "QR login sessiyasi topilmadi yoki muddati tugagan."

    challenge.status = "REJECTED"
    challenge.save(update_fields=["status"])
    return True, None


def mark_qr_challenge_used(challenge):
    challenge.used_at = timezone.now()
    challenge.save(update_fields=["used_at"])
