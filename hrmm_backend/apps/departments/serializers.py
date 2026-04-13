from rest_framework import serializers

from apps.departments.models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    head_user_name = serializers.CharField(source="head_user_id.full_name", read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "code", "head_user_id", "head_user_name", "is_active", "created_at"]
