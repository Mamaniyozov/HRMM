from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.authentication.models import RevokedToken
from apps.users.models import User


class HRMMJWTAuthentication(JWTAuthentication):
    def get_validated_token(self, raw_token):
        validated_token = super().get_validated_token(raw_token)
        jti = validated_token.get("jti")

        if jti and RevokedToken.objects.filter(jti=str(jti)).exists():
            raise exceptions.AuthenticationFailed("Token bekor qilingan.")

        return validated_token

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")

        if not user_id:
            raise exceptions.AuthenticationFailed("Token ichida user_id topilmadi.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Foydalanuvchi topilmadi.") from exc

        if not user.is_active:
            raise exceptions.AuthenticationFailed("Foydalanuvchi faol emas.")

        return user
