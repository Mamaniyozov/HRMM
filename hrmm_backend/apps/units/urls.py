from django.urls import path

from apps.units.views import UnitDetailView, UnitListCreateView


urlpatterns = [
    path("", UnitListCreateView.as_view(), name="unit_list"),
    path("<uuid:unit_id>/", UnitDetailView.as_view(), name="unit_detail"),
]
