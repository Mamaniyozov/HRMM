from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.users.models import User
from .serializers import (
    UserCreateSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
)


# --- Custom permission: only DIRECTOR can manage users ---
class IsDirector(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "DIRECTOR"


# --- Create user ---
class UserCreateView(APIView):
    permission_classes = [IsDirector]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "User successfully created"},
            status=status.HTTP_201_CREATED,
        )


# --- List users ---
class UserListView(APIView):
    permission_classes = [IsDirector]

    def get(self, request):
        users = User.objects.filter(is_active=True)
        serializer = UserDetailSerializer(users, many=True)
        return Response(serializer.data)


# --- Single user detail ---
class UserDetailView(APIView):
    permission_classes = [IsDirector]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = UserDetailSerializer(user)
        return Response(serializer.data)


# --- Update user ---
class UserUpdateView(APIView):
    permission_classes = [IsDirector]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({"message": "User updated successfully"})