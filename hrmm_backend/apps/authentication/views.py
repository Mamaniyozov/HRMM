import logging

from rest_framework.views import APIView
from rest_framework import status, serializers
from rest_framework.response import Response
from html import escape
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenRefreshView
from django.utils import timezone
from django.core import signing
from apps.audit.services import create_audit_log
from config.responses import api_success
from config.throttling import LoginRateThrottle, OTPRateThrottle, UsernameIPLocaleRateThrottle
from apps.reports.views import IsAuthenticatedHRMM
from apps.users.models import User
from .models import QRLoginChallenge

logger = logging.getLogger("hrmm")
from .serializers import (
    EmailOTPLoginVerifySerializer,
    LoginSerializer,
    LogoutSerializer,
    MeSerializer,
    PasswordChangeSerializer,
    RegisterSerializer,
    TwoFactorDisableSerializer,
    TwoFactorLoginVerifySerializer,
    TwoFactorSetupSerializer,
    TwoFactorVerifySetupSerializer,
)
from .tokens import get_tokens_for_user
from .email_otp import create_login_email_challenge, mask_email, send_login_email_code, verify_email_challenge
from .qr_login import (
    approve_qr_login_challenge,
    build_qr_login_data_uri,
    create_qr_login_challenge,
    get_pending_qr_challenge,
    mark_qr_challenge_used,
)
from .two_factor import (
    build_login_challenge,
    build_otpauth_url,
    build_qr_code_url,
    generate_totp_secret,
    read_login_challenge,
    verify_totp,
)



class LoginView(APIView):
    authentication_classes = []  # login uchun auth keremas
    permission_classes = []
    throttle_classes = [LoginRateThrottle, UsernameIPLocaleRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        if user.role == "DIRECTOR" and not user.two_factor_enabled:
            if not user.totp_secret:
                user.totp_secret = generate_totp_secret()
                user.save(update_fields=["totp_secret", "updated_at"])
            if user.email:
                challenge, code = create_login_email_challenge(user)
                send_login_email_code(user, code)
                return api_success(
                    message="Email verification required. DIRECTOR uchun 2FA majburiy.",
                    data={
                        "requires_two_factor": True,
                        "verification_method": "email",
                        "challenge_id": str(challenge.id),
                        "masked_email": mask_email(user.email),
                        "mandatory_2fa": True,
                    },
                    status_code=status.HTTP_200_OK,
                )
            return api_success(
                message="DIRECTOR uchun 2FA majburiy. Iltimos, authenticator ilovasini sozlang.",
                data={
                    "requires_two_factor": True,
                    "verification_method": "authenticator_setup",
                    "challenge_token": build_login_challenge(user),
                    "qr_code_url": build_qr_code_url(build_otpauth_url(user)),
                    "otpauth_url": build_otpauth_url(user),
                    "secret": user.totp_secret,
                    "mandatory_2fa": True,
                },
                status_code=status.HTTP_200_OK,
            )

        if not user.totp_secret:
            user.totp_secret = generate_totp_secret()
            user.save(update_fields=["totp_secret", "updated_at"])

        if not user.two_factor_enabled:
            if user.email:
                challenge, code = create_login_email_challenge(user)
                send_login_email_code(user, code)
                return api_success(
                    message="Email verification required",
                    data={
                        "requires_two_factor": True,
                        "verification_method": "email",
                        "challenge_id": str(challenge.id),
                        "masked_email": mask_email(user.email),
                    },
                    status_code=status.HTTP_200_OK,
                )
            else:
                return api_success(
                    message="Authenticator QR setup required",
                    data={
                        "requires_two_factor": True,
                        "verification_method": "authenticator_setup",
                        "challenge_token": build_login_challenge(user),
                        "qr_code_url": build_qr_code_url(build_otpauth_url(user)),
                        "otpauth_url": build_otpauth_url(user),
                        "secret": user.totp_secret,
                    },
                    status_code=status.HTTP_200_OK,
                )

        if user.two_factor_enabled and user.totp_secret:
            return api_success(
                message="2FA verification required",
                data={
                    "requires_two_factor": True,
                    "verification_method": "authenticator",
                    "challenge_token": build_login_challenge(user),
                },
                status_code=status.HTTP_200_OK,
            )


        tokens = get_tokens_for_user(user)
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at", "updated_at"])
        create_audit_log(
            actor=user,
            action="LOGIN",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} tizimga kirdi",
            request=request,
        )

        return api_success(
            message="Login successful",
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "requires_two_factor": False,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role,
                    "job_role": user.job_role,
                    "job_level": user.job_level,
                },
            },
            status_code=status.HTTP_200_OK,
        )


class RegisterView(APIView):
    permission_classes = [IsAuthenticatedHRMM]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        if getattr(request.user, "role", None) != "DIRECTOR":
            return api_success(
                message="Faqat direktor yangi foydalanuvchi qo'sha oladi.",
                data=None,
                status_code=status.HTTP_403_FORBIDDEN,
            )
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except serializers.ValidationError:
            raise  # DRF avtomatik 400 bilan qaytaradi
        except Exception:
            logger.exception("Register failed for username=%s", request.data.get("username"))
            return api_success(
                message="Ro'yxatdan o'tishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
                data=None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        user.totp_secret = generate_totp_secret()
        user.save(update_fields=["totp_secret", "updated_at"])
        create_audit_log(
            actor=user,
            action="USER_REGISTER",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} ro'yxatdan o'tdi",
            request=request,
        )
        return api_success(
            message="Registration successful",
            data={
                "id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
            },
            status_code=status.HTTP_201_CREATED,
        )


class VerifyLoginEmailOTPView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        serializer = EmailOTPLoginVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge = serializer.validated_data["challenge"]
        is_valid, error_message = verify_email_challenge(challenge, serializer.validated_data["code"])
        if not is_valid:
            raise ValidationError(error_message)

        user = challenge.user
        tokens = get_tokens_for_user(user)
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at", "updated_at"])
        create_audit_log(
            actor=user,
            action="LOGIN_EMAIL_OTP",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} email OTP orqali tizimga kirdi",
            request=request,
        )

        return api_success(
            message="Email verification successful",
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "requires_two_factor": False,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role,
                    "job_role": user.job_role,
                    "job_level": user.job_level,
                },
            },
            status_code=status.HTTP_200_OK,
        )


class VerifyLoginTwoFactorView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        serializer = TwoFactorLoginVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            challenge_payload = read_login_challenge(serializer.validated_data["challenge_token"])
            user = User.objects.get(id=challenge_payload["user_id"])
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist, KeyError) as exc:
            raise ValidationError("2FA session muddati tugagan yoki noto'g'ri.") from exc

        was_enabled = user.two_factor_enabled

        if not user.totp_secret:
            raise ValidationError("Foydalanuvchi uchun 2FA maxfiy kaliti topilmadi.")

        if not verify_totp(user.totp_secret, serializer.validated_data["code"]):
            raise ValidationError("6 xonali kod noto'g'ri yoki eskirgan.")

        update_fields = ["last_login_at", "updated_at"]
        if not user.two_factor_enabled:
            user.two_factor_enabled = True
            user.two_factor_confirmed_at = timezone.now()
            update_fields.extend(["two_factor_enabled", "two_factor_confirmed_at"])

        tokens = get_tokens_for_user(user)
        user.last_login_at = timezone.now()
        user.save(update_fields=update_fields)
        create_audit_log(
            actor=user,
            action="LOGIN_2FA" if was_enabled else "LOGIN_2FA_SETUP",
            target_type="users.User",
            target_id=user.id,
            description=(
                f"{user.username} birinchi authenticator setup orqali tizimga kirdi"
                if not was_enabled
                else f"{user.username} authenticator orqali tizimga kirdi"
            ),
            request=request,
        )

        return api_success(
            message="Two-factor login successful",
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "requires_two_factor": False,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role,
                    "job_role": user.job_role,
                    "job_level": user.job_level,
                },
            },
            status_code=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        return api_success(data=MeSerializer(request.user).data)
    
    def put(self, request):
        if request.data.get("is_active") is False:
            return api_success(
                message="O'zingizni deactivate qila olmaysiz",
                data=None,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        serializer = MeSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return api_success(data=MeSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="LOGOUT",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} tizimdan chiqdi",
            request=request,
        )
        return api_success(message="Logout successful")


class HRMMTokenRefreshView(TokenRefreshView):
    """Token refresh with revoked token check."""

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.settings import api_settings as jwt_settings
        from rest_framework_simplejwt.tokens import RefreshToken
        from apps.authentication.models import RevokedToken

        refresh_token = request.data.get("refresh", "")
        try:
            token = RefreshToken(refresh_token)
            jti = str(token.get("jti"))
            if RevokedToken.objects.filter(jti=jti).exists():
                return api_success(
                    message="Refresh token bekor qilingan.",
                    data=None,
                    status_code=status.HTTP_401_UNAUTHORIZED,
                )
            user = User.objects.filter(id=token.get("user_id")).first()
            if not user or not user.is_active:
                return api_success(
                    message="Foydalanuvchi topilmadi yoki faol emas.",
                    data=None,
                    status_code=status.HTTP_401_UNAUTHORIZED,
                )
        except Exception:
            return api_success(
                message="Noto'g'ri refresh token.",
                data=None,
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        data = {"access": str(token.access_token)}
        if jwt_settings.ROTATE_REFRESH_TOKENS:
            token.set_jti()
            token.set_exp()
            token.set_iat()
            data["refresh"] = str(token)

        return api_success(message="Token refreshed", data=data)


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def put(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="PASSWORD_CHANGE",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} parolini yangiladi",
            request=request,
        )
        return api_success(message="Password changed successfully")


class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request):
        serializer = TwoFactorSetupSerializer(data={}, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        create_audit_log(
            actor=request.user,
            action="TWO_FACTOR_SETUP_STARTED",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} 2FA setup boshladi",
            request=request,
        )
        return api_success(message="Two-factor setup created", data=data)


class TwoFactorVerifySetupView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request):
        serializer = TwoFactorVerifySetupSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="TWO_FACTOR_ENABLED",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} 2FA yoqdi",
            request=request,
        )
        return api_success(message="Two-factor authentication enabled")


class TwoFactorDisableView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def post(self, request):
        serializer = TwoFactorDisableSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        create_audit_log(
            actor=request.user,
            action="TWO_FACTOR_DISABLED",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} 2FA o'chirdi",
            request=request,
        )
        return api_success(message="Two-factor authentication disabled")


class QRLoginChallengeView(APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [LoginRateThrottle, UsernameIPLocaleRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        challenge, token, short_token = create_qr_login_challenge(user)
        approve_url_base = request.data.get("approve_url_base", "")
        if approve_url_base:
            approve_url = f"{approve_url_base.rstrip('/')}/?qr-approve={short_token}"
        else:
            approve_url = request.build_absolute_uri(f"/api/v1/auth/login/qr-approve/?token={short_token}")
        qr_code_url = build_qr_login_data_uri(short_token, approve_url=approve_url)

        return api_success(
            message="QR login challenge created",
            data={
                "challenge_token": token,
                "qr_code_url": qr_code_url,
                "approve_url": approve_url,
                "expires_at": challenge.expires_at.isoformat(),
            },
            status_code=status.HTTP_200_OK,
        )


class QRLoginStatusView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.data.get("challenge_token") or request.GET.get("token")
        if not token:
            raise ValidationError("challenge_token majburiy.")

        challenge = QRLoginChallenge.objects.filter(challenge_token=token).first()
        if not challenge:
            raise ValidationError("QR login sessiyasi topilmadi.")

        if challenge.status == "PENDING" and challenge.expires_at <= timezone.now():
            challenge.status = "EXPIRED"
            challenge.save(update_fields=["status"])

        return api_success(
            message="QR login status",
            data={
                "status": challenge.status,
                "expires_at": challenge.expires_at.isoformat(),
            },
            status_code=status.HTTP_200_OK,
        )


class QRLoginApproveView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def _get_token(self, request):
        return request.data.get("token") or request.GET.get("token")

    def get(self, request):
        token = self._get_token(request)
        if not token:
            raise ValidationError("token majburiy.")

        challenge = (
            QRLoginChallenge.objects.filter(challenge_token=token).first()
            or QRLoginChallenge.objects.filter(short_token=token).first()
        )
        if not challenge:
            raise ValidationError("QR login sessiyasi topilmadi.")
        if challenge.status == "PENDING" and challenge.expires_at <= timezone.now():
            challenge.status = "EXPIRED"
            challenge.save(update_fields=["status"])
        if challenge.status != "PENDING":
            raise ValidationError(f"QR login sessiyasi {challenge.status} holatida.")

        current_user = request.user if request.user and request.user.is_authenticated else None
        is_authorized = current_user and challenge.user.id == current_user.id
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>HRMM QR Login</title>
          <style>
            body {{ font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }}
            .card {{ background: #1e293b; padding: 2rem; border-radius: 1rem; max-width: 400px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }}
            h1 {{ margin: 0 0 0.5rem; font-size: 1.5rem; }}
            p {{ color: #94a3b8; margin-bottom: 1.5rem; }}
            button {{ border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; margin: 0.25rem; }}
            .approve {{ background: #10b981; color: #fff; }}
            .reject {{ background: #ef4444; color: #fff; }}
            .info {{ background: #334155; color: #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="card">
            <h1>HRMM QR Login</h1>
            <p>Yangi qurilmadan kirishni tasdiqlash uchun foydalanuvchi: <strong>{escape(challenge.user.full_name)}</strong></p>
            {"<form method='post'><button type='submit' class='approve' name='action' value='approve'>Tasdiqlash</button><button type='submit' class='reject' name='action' value='reject'>Rad etish</button></form>" if is_authorized else "<button class='info' disabled>Siz faqat o'z hisobingizga kirishni tasdiqlashingiz mumkin.</button>"}
          </div>
        </body>
        </html>
        """
        return Response(html, content_type="text/html")

    def post(self, request):
        token = self._get_token(request)
        if not token:
            raise ValidationError("token majburiy.")

        action = request.data.get("action") or request.POST.get("action") or "approve"
        if action not in {"approve", "reject"}:
            raise ValidationError("action 'approve' yoki 'reject' bo'lishi kerak.")

        if action == "reject":
            from .qr_login import reject_qr_login_challenge

            ok, error = reject_qr_login_challenge(token)
            if not ok:
                raise ValidationError(error)
            return api_success(message="QR login rejected")

        ok, error = approve_qr_login_challenge(token, request.user)
        if not ok:
            raise ValidationError(error)

        create_audit_log(
            actor=request.user,
            action="QR_LOGIN_APPROVED",
            target_type="users.User",
            target_id=request.user.id,
            description=f"{request.user.username} yangi qurilmadan kirishni QR orqali tasdiqladi",
            request=request,
        )
        return api_success(message="QR login approved")


class QRLoginCompleteView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        token = request.data.get("challenge_token")
        if not token:
            raise ValidationError("challenge_token majburiy.")

        challenge = QRLoginChallenge.objects.filter(
            challenge_token=token,
            status="APPROVED",
            used_at__isnull=True,
        ).select_related("user").first()

        if not challenge:
            raise ValidationError("QR login tasdiqlanmagan yoki allaqachon ishlatilgan.")

        if challenge.expires_at <= timezone.now():
            raise ValidationError("QR login muddati tugagan.")

        user = challenge.user
        tokens = get_tokens_for_user(user)
        user.last_login_at = timezone.now()
        user.save(update_fields=["last_login_at", "updated_at"])
        mark_qr_challenge_used(challenge)

        create_audit_log(
            actor=user,
            action="LOGIN_QR",
            target_type="users.User",
            target_id=user.id,
            description=f"{user.username} QR login orqali yangi qurilmadan kirdi",
            request=request,
        )

        return api_success(
            message="QR login successful",
            data={
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role,
                    "job_role": user.job_role,
                    "job_level": user.job_level,
                },
            },
            status_code=status.HTTP_200_OK,
        )
