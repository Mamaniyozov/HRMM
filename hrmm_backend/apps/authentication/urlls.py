from django.urls import path ,include
from .views import LoginView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]