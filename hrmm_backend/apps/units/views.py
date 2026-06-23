from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.audit.services import create_audit_log
from apps.reports.views import IsAuthenticatedHRMM
from apps.units.models import Unit
from apps.units.serializers import UnitSerializer
from config.api_utils import paginate_queryset
from config.responses import api_success


class IsDirectorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and getattr(request.user, "id", None)):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, "role", None) == "DIRECTOR"


class UnitListCreateView(APIView):
    permission_classes = [IsDirectorOrReadOnly]

    def get(self, request):
        units = Unit.objects.select_related("department_id", "head_user_id").order_by("name")
        search = request.query_params.get("search")
        department_id = request.query_params.get("department_id")
        is_active = request.query_params.get("is_active")

        if search:
            units = units.filter(Q(name__icontains=search) | Q(code__icontains=search))
        if department_id:
            units = units.filter(department_id_id=department_id)
        if is_active in {"true", "false"}:
            units = units.filter(is_active=(is_active == "true"))

        return paginate_queryset(request, units, UnitSerializer)

    def post(self, request):
        serializer = UnitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = serializer.save()
        create_audit_log(
            actor=request.user,
            action="UNIT_CREATE",
            target_type="units.Unit",
            target_id=unit.id,
            description=f"{request.user.username} birlik yaratdi: {unit.name}",
            request=request,
        )
        return api_success(
            message="Unit created",
            data=UnitSerializer(unit).data,
            status_code=status.HTTP_201_CREATED,
        )


class UnitDetailView(APIView):
    permission_classes = [IsDirectorOrReadOnly]

    def get(self, request, unit_id):
        try:
            unit = Unit.objects.get(id=unit_id)
        except Unit.DoesNotExist:
            return api_success(message="Unit not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        return api_success(data=UnitSerializer(unit).data)

    def put(self, request, unit_id):
        try:
            unit = Unit.objects.get(id=unit_id)
        except Unit.DoesNotExist:
            return api_success(message="Unit not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        serializer = UnitSerializer(unit, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        unit = serializer.save()
        create_audit_log(
            actor=request.user,
            action="UNIT_UPDATE",
            target_type="units.Unit",
            target_id=unit.id,
            description=f"{request.user.username} birlikni yangiladi: {unit.name}",
            request=request,
        )
        return api_success(data=UnitSerializer(unit).data)

    def delete(self, request, unit_id):
        try:
            unit = Unit.objects.get(id=unit_id)
        except Unit.DoesNotExist:
            return api_success(message="Unit not found", data=None, status_code=status.HTTP_404_NOT_FOUND)
        unit.is_active = False
        unit.save(update_fields=["is_active"])
        create_audit_log(
            actor=request.user,
            action="UNIT_DELETE",
            target_type="units.Unit",
            target_id=unit.id,
            description=f"{request.user.username} birlikni o'chirdi: {unit.name}",
            request=request,
        )
        return api_success(message="Unit deleted")
