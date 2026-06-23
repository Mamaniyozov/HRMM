from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.audit.services import create_audit_log
from apps.departments.models import Department
from apps.departments.serializers import DepartmentSerializer
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset
from config.responses import api_success


class IsDirectorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, "id", None)):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, "role", None) == "DIRECTOR"


class DepartmentListCreateView(APIView):
    permission_classes = [IsDirectorOrReadOnly]

    def get(self, request):
        departments = Department.objects.select_related("head_user_id").order_by("name")
        search = request.query_params.get("search")
        is_active = request.query_params.get("is_active")

        if search:
            departments = departments.filter(Q(name__icontains=search) | Q(code__icontains=search))
        if is_active in {"true", "false"}:
            departments = departments.filter(is_active=(is_active == "true"))

        return paginate_queryset(request, departments, DepartmentSerializer)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        create_audit_log(
            actor=request.user,
            action="DEPARTMENT_CREATE",
            target_type="departments.Department",
            target_id=department.id,
            description=f"{request.user.username} bo'lim yaratdi: {department.name}",
            request=request,
        )
        return api_success(
            message="Department created",
            data=DepartmentSerializer(department).data,
            status_code=status.HTTP_201_CREATED,
        )


class DepartmentDetailView(APIView):
    permission_classes = [IsDirectorOrReadOnly]

    def get(self, request, department_id):
        try:
            department = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return api_success(message="Department not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        return api_success(data=DepartmentSerializer(department).data)

    def put(self, request, department_id):
        try:
            department = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return api_success(message="Department not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(department, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        create_audit_log(
            actor=request.user,
            action="DEPARTMENT_UPDATE",
            target_type="departments.Department",
            target_id=department.id,
            description=f"{request.user.username} bo'limni yangiladi: {department.name}",
            request=request,
        )
        return api_success(data=DepartmentSerializer(department).data)

    def delete(self, request, department_id):
        try:
            department = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return api_success(message="Department not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        department.is_active = False
        department.save(update_fields=["is_active"])
        create_audit_log(
            actor=request.user,
            action="DEPARTMENT_DELETE",
            target_type="departments.Department",
            target_id=department.id,
            description=f"{request.user.username} bo'limni o'chirdi: {department.name}",
            request=request,
        )
        return api_success(message="Department deleted")
