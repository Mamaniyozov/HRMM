from django.urls import path

from apps.units.views import UnitListView


urlpatterns = [
    path("", UnitListView.as_view(), name="unit_list"),
]
