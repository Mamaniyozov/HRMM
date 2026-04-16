from rest_framework import serializers
from apps.users.models import User
from django.contrib.auth.hashers import check_password, make_password
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import RevokedToken

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Xato username yoki parol.")

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
            "phone",
            "avatar_url",
            "last_login_at",
        ]


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
