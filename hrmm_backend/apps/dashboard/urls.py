from django.urls import path

from apps.dashboard.views import DashboardAdminView, DashboardAnalyticsView, DashboardStatsView


urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard_stats"),
    path("admin/", DashboardAdminView.as_view(), name="dashboard_admin"),
    path("analytics/", DashboardAnalyticsView.as_view(), name="dashboard_analytics"),
]
