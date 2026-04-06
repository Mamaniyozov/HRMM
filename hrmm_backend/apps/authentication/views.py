from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import LoginSerializer
from .tokens import get_tokens_for_user
from django.urls import path


urlpatterns = [
   path("login/", TokenObtainPairView.as_view()),
]




class LoginView(APIView):
    authentication_classes = []  # login uchun auth keremas
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)

        return Response({
            "access": tokens["access"],
            "refresh": tokens["refresh"],
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role
            }
        }, status=status.HTTP_200_OK)