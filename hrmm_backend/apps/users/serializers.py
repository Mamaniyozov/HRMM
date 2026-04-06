from rest_framework import serializers
from apps.users.models import User
from django.contrib.auth.hashers import make_password


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "full_name",
            "role",
            "password",
            "department_id",
            "unit_id",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["password_hash"] = make_password(password)
        return User.objects.create(**validated_data)


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "department_id",
            "unit_id",
            "is_active",
            "phone",
            "avatar_url",
            "created_at",
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "role",
            "department_id",
            "unit_id",
            "is_active",
            "phone",
            "avatar_url",
        ]