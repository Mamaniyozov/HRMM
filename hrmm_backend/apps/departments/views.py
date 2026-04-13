from django.db.models import Q
from rest_framework.views import APIView

from apps.departments.models import Department
from apps.departments.serializers import DepartmentSerializer
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset


class DepartmentListView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        departments = Department.objects.select_related("head_user_id").order_by("name")
        search = request.query_params.get("search")
        is_active = request.query_params.get("is_active")

        if search:
            departments = departments.filter(Q(name__icontains=search) | Q(code__icontains=search))
        if is_active in {"true", "false"}:
            departments = departments.filter(is_active=(is_active == "true"))

        return paginate_queryset(request, departments, DepartmentSerializer)
