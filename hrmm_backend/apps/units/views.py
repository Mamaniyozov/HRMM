from django.db.models import Q
from rest_framework.views import APIView

from apps.reports.views import IsAuthenticatedHRMM
from apps.units.models import Unit
from apps.units.serializers import UnitSerializer
from config.api_utils import paginate_queryset


class UnitListView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

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
