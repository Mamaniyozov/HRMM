from django.urls import path

from apps.departments.views import DepartmentDetailView, DepartmentListCreateView


urlpatterns = [
    path("", DepartmentListCreateView.as_view(), name="department_list"),
    path("<uuid:department_id>/", DepartmentDetailView.as_view(), name="department_detail"),
]
