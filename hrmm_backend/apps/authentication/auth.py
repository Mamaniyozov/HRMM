from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.users.models import User


class HRMMJWTAuthentication(JWTAuthentication):
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
