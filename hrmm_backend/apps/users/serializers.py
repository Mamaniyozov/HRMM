from rest_framework import serializers
from apps.users.models import User, UserFeedback
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
            "job_role",
            "job_level",
            "password",
            "department_id",
            "unit_id",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["password_hash"] = make_password(password)
        return User.objects.create(**validated_data)

    def validate(self, attrs):
        role = attrs.get("role")
        job_role = attrs.get("job_role")
        job_level = attrs.get("job_level")
        department = attrs.get("department_id")
        unit = attrs.get("unit_id")

        if role in {"UNIT_HEAD", "DEPT_HEAD"} and not department:
            raise serializers.ValidationError({"department_id": "Bu rol uchun department majburiy."})
        if role == "UNIT_HEAD" and not unit:
            raise serializers.ValidationError({"unit_id": "UNIT_HEAD uchun unit majburiy."})
        if role == "DEPT_HEAD" and unit:
            raise serializers.ValidationError({"unit_id": "DEPT_HEAD uchun unit kiritilmaydi."})
        if role == "DIRECTOR" and (department or unit):
            raise serializers.ValidationError({"role": "DIRECTOR uchun department va unit biriktirilmaydi."})
        if unit and department and unit.department_id.id != department.id:
            raise serializers.ValidationError({"unit_id": "Tanlangan unit shu departmentga tegishli emas."})
        if job_role and not department:
            raise serializers.ValidationError({"department_id": "Kasbiy rol berilganda department majburiy."})
        if job_level and not job_role:
            raise serializers.ValidationError({"job_level": "Daraja berish uchun avval job_role tanlang."})

        return attrs


class UserDetailSerializer(serializers.ModelSerializer):
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
            "job_role",
            "job_level",
            "department_id",
            "unit_id",
            "is_active",
            "phone",
            "avatar_url",
        ]

    def validate(self, attrs):
        role = attrs.get("role", self.instance.role)
        job_role = attrs.get("job_role", self.instance.job_role)
        job_level = attrs.get("job_level", self.instance.job_level)
        department = attrs.get("department_id", self.instance.department_id)
        unit = attrs.get("unit_id", self.instance.unit_id)

        if role in {"UNIT_HEAD", "DEPT_HEAD"} and not department:
            raise serializers.ValidationError({"department_id": "Bu rol uchun department majburiy."})
        if role == "UNIT_HEAD" and not unit:
            raise serializers.ValidationError({"unit_id": "UNIT_HEAD uchun unit majburiy."})
        if role == "DEPT_HEAD" and unit:
            raise serializers.ValidationError({"unit_id": "DEPT_HEAD uchun unit kiritilmaydi."})
        if role == "DIRECTOR" and (department or unit):
            raise serializers.ValidationError({"role": "DIRECTOR uchun department va unit biriktirilmaydi."})
        if unit and department and unit.department_id.id != department.id:
            raise serializers.ValidationError({"unit_id": "Tanlangan unit shu departmentga tegishli emas."})
        if job_role and not department:
            raise serializers.ValidationError({"department_id": "Kasbiy rol berilganda department majburiy."})
        if job_level and not job_role:
            raise serializers.ValidationError({"job_level": "Daraja berish uchun avval job_role tanlang."})

        return attrs


class UserFeedbackSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    author_role = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model = UserFeedback
        fields = ["id", "author", "author_name", "author_role", "rating", "comment", "created_at"]
        read_only_fields = ["id", "author", "author_name", "author_role", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Baho 1 dan 5 gacha bo'lishi kerak.")
        return value

    def create(self, validated_data):
        request = self.context["request"]
        return UserFeedback.objects.create(author=request.user, **validated_data)
