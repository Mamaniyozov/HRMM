from rest_framework import serializers

from apps.units.models import Unit


class UnitSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department_id.name", read_only=True)
    head_user_name = serializers.CharField(source="head_user_id.full_name", read_only=True)

    class Meta:
        model = Unit
        fields = [
            "id",
            "department_id",
            "department_name",
            "name",
            "code",
            "head_user_id",
            "head_user_name",
            "is_active",
            "created_at",
        ]
