from rest_framework import serializers
from apps.users.models import User
from django.contrib.auth.hashers import check_password

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