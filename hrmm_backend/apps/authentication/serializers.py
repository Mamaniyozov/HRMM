from rest_framework import serializers
from apps.users.models import User
from django.contrib.auth.hashers import check_password, make_password
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import EmailOTPChallenge, RevokedToken
from .two_factor import (
    build_otpauth_url,
    build_qr_code_url,
    generate_totp_secret,
    verify_totp,
)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        try:
            user = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Xato username yoki parol.")

        if not user.is_active:
            raise serializers.ValidationError("Foydalanuvchi faol emas.")

        if not check_password(password, user.password_hash):
            raise serializers.ValidationError("Xato username yoki parol.")

        attrs["user"] = user
        return attrs


class MeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department_id.name", read_only=True)
    unit_name = serializers.CharField(source="unit_id.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "job_role",
            "job_level",
            "department_id",
            "department_name",
            "unit_id",
            "unit_name",
            "language",
            "is_active",
            "phone",
            "avatar_url",
            "created_at",
            "two_factor_enabled",
            "two_factor_confirmed_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "full_name",
            "password",
            "password_confirm",
        ]

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Bu username allaqachon ro'yxatdan o'tgan.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Bu email allaqachon ro'yxatdan o'tgan.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Parollar mos kelmadi."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        validated_data["password_hash"] = make_password(password)
        validated_data["role"] = "SPECIALIST"
        validated_data["language"] = "uz"
        return User.objects.create(**validated_data)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def save(self, **kwargs):
        refresh_token = self.validated_data["refresh"]
        token = RefreshToken(refresh_token)
        RevokedToken.objects.get_or_create(
            jti=str(token.get("jti")),
            defaults={"token_type": "refresh"},
        )


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not check_password(value, user.password_hash):
            raise serializers.ValidationError("Joriy parol noto'g'ri.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.password_hash = make_password(self.validated_data["new_password"])
        user.save(update_fields=["password_hash", "updated_at"])
        return user


class TwoFactorSetupSerializer(serializers.Serializer):
    secret = serializers.CharField(read_only=True)
    otpauth_url = serializers.CharField(read_only=True)
    qr_code_url = serializers.CharField(read_only=True)
    already_enabled = serializers.BooleanField(read_only=True)

    def create(self, validated_data):
        user = self.context["request"].user
        user.totp_secret = generate_totp_secret()
        user.two_factor_enabled = False
        user.two_factor_confirmed_at = None
        user.save(update_fields=["totp_secret", "two_factor_enabled", "two_factor_confirmed_at", "updated_at"])
        return {
            "secret": user.totp_secret,
            "otpauth_url": build_otpauth_url(user),
            "qr_code_url": build_qr_code_url(build_otpauth_url(user)),
            "already_enabled": False,
        }


class TwoFactorVerifySetupSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

    def validate_code(self, value):
        user = self.context["request"].user
        if not user.totp_secret:
            raise serializers.ValidationError("Avval 2FA setup ni boshlang.")
        if not verify_totp(user.totp_secret, value):
            raise serializers.ValidationError("6 xonali kod noto'g'ri yoki eskirgan.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        from django.utils import timezone

        user.two_factor_enabled = True
        user.two_factor_confirmed_at = timezone.now()
        user.save(update_fields=["two_factor_enabled", "two_factor_confirmed_at", "updated_at"])
        return user


class TwoFactorDisableSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.two_factor_enabled or not user.totp_secret:
            raise serializers.ValidationError("2FA allaqachon o'chirilgan.")
        if not check_password(attrs["current_password"], user.password_hash):
            raise serializers.ValidationError("Joriy parol noto'g'ri.")
        if not verify_totp(user.totp_secret, attrs["code"]):
            raise serializers.ValidationError("Tasdiqlash kodi noto'g'ri yoki eskirgan.")
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.two_factor_enabled = False
        user.two_factor_confirmed_at = None
        user.totp_secret = ""
        user.save(update_fields=["two_factor_enabled", "two_factor_confirmed_at", "totp_secret", "updated_at"])
        return user


class TwoFactorLoginVerifySerializer(serializers.Serializer):
    challenge_token = serializers.CharField()
    code = serializers.CharField(max_length=6)


class EmailOTPLoginVerifySerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        challenge = EmailOTPChallenge.objects.filter(
            id=attrs["challenge_id"],
            purpose="LOGIN",
        ).select_related("user").first()
        if not challenge:
            raise serializers.ValidationError("Email tasdiqlash sessiyasi topilmadi.")
        attrs["challenge"] = challenge
        return attrs
