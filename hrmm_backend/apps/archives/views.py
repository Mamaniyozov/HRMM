from datetime import timedelta

from django.utils import timezone
from rest_framework.views import APIView

from apps.archives.models import ArchiveLog
from apps.archives.serializers import ArchiveLogSerializer
from apps.reports.views import IsAuthenticatedHRMM
from config.api_utils import paginate_queryset


class ArchiveLogListView(APIView):
    permission_classes = [IsAuthenticatedHRMM]

    def get(self, request):
        cutoff = timezone.now() - timedelta(days=7)
        logs = ArchiveLog.objects.filter(archived_at__gte=cutoff).order_by("-archived_at")
        return paginate_queryset(request, logs, ArchiveLogSerializer)
