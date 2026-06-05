from django.urls import path

from apps.archives.views import ArchiveLogListView

urlpatterns = [
    path("", ArchiveLogListView.as_view(), name="archive_logs"),
]
