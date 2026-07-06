import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailOTPChallenge


def _hash_code(code):
    return hashlib.sha256(f"{settings.SECRET_KEY}:{code}".encode("utf-8")).hexdigest()


def mask_email(email):
    local, _, domain = str(email or "").partition("@")
    if not local or not domain:
        return email or "-"
    visible = local[:2] if len(local) > 2 else local[:1]
    return f"{visible}{'*' * max(len(local) - len(visible), 1)}@{domain}"


def generate_email_otp_code():
    return f"{secrets.randbelow(1000000):06d}"


def create_login_email_challenge(user):
    EmailOTPChallenge.objects.filter(user=user, purpose="LOGIN", used_at__isnull=True).delete()

    code = generate_email_otp_code()
    challenge = EmailOTPChallenge.objects.create(
        user=user,
        purpose="LOGIN",
        code_hash=_hash_code(code),
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    return challenge, code


def send_login_email_code(user, code):
    subject = "HRMM login verification code"
    message = (
        f"Salom, {user.full_name}.\n\n"
        f"HRMM tizimiga kirish uchun tasdiqlash kodi: {code}\n"
        f"Kod 15 daqiqa davomida amal qiladi.\n\n"
        "Agar bu kirish siz tomonidan bo'lmasa, bu xabarni e'tiborsiz qoldiring."
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def verify_email_challenge(challenge, code):
    from django.db import transaction

    with transaction.atomic():
        locked = EmailOTPChallenge.objects.select_for_update().get(id=challenge.id)
        if locked.used_at:
            return False, "Kod allaqachon ishlatilgan."
        if locked.expires_at <= timezone.now():
            return False, "Kod muddati tugagan."
        if locked.attempt_count >= 5:
            return False, "Urinishlar soni oshib ketdi. Qayta login qiling."

        locked.attempt_count = locked.attempt_count + 1
        if locked.code_hash != _hash_code(code):
            locked.save(update_fields=["attempt_count"])
            return False, "6 xonali kod noto'g'ri."

        locked.used_at = timezone.now()
        locked.save(update_fields=["attempt_count", "used_at"])
        return True, None
