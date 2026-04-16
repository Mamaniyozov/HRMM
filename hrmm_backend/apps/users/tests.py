from django.test import TestCase
from rest_framework.test import APIClient

from apps.departments.models import Department
from apps.users.models import User
from apps.users.serializers import UserCreateSerializer


class UserDeleteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.director = User.objects.create(
            username="director_delete",
            email="director_delete@example.com",
            password_hash="12345678",
            full_name="Director Delete",
            role="DIRECTOR",
            is_active=True,
        )
        self.target_user = User.objects.create(
            username="target_user",
            email="target_user@example.com",
            password_hash="12345678",
            full_name="Target User",
            role="SPECIALIST",
            is_active=True,
        )
        self.client.force_authenticate(user=self.director)

    def test_director_can_soft_delete_user(self):
        response = self.client.delete(f"/api/v1/users/{self.target_user.id}/delete/")
        self.target_user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.target_user.is_active)

    def test_director_cannot_delete_self(self):
        response = self.client.delete(f"/api/v1/users/{self.director.id}/delete/")

        self.assertEqual(response.status_code, 400)


class UserJobProfileTests(TestCase):
    def setUp(self):
        self.backend_department = Department.objects.create(name="Backend Development", code="BACK")
        self.hr_department = Department.objects.create(name="HR Department", code="HR")

    def test_it_job_role_and_level_are_valid_for_it_department(self):
        serializer = UserCreateSerializer(
            data={
                "username": "backend_junior",
                "email": "backend_junior@example.com",
                "password": "12345678",
                "full_name": "Backend Junior",
                "role": "SPECIALIST",
                "job_role": "BACKEND_DEV",
                "job_level": "JUNIOR",
                "department_id": self.backend_department.id,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()

        self.assertEqual(user.job_role, "BACKEND_DEV")
        self.assertEqual(user.job_level, "JUNIOR")

    def test_job_level_requires_job_role(self):
        serializer = UserCreateSerializer(
            data={
                "username": "frontend_middle",
                "email": "frontend_middle@example.com",
                "password": "12345678",
                "full_name": "Frontend Middle",
                "role": "SPECIALIST",
                "job_level": "MIDDLE",
                "department_id": self.hr_department.id,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("job_level", serializer.errors)

    def test_manager_job_role_is_valid_for_it_department(self):
        serializer = UserCreateSerializer(
            data={
                "username": "it_manager",
                "email": "it_manager@example.com",
                "password": "12345678",
                "full_name": "IT Manager",
                "role": "SPECIALIST",
                "job_role": "MANAGER",
                "job_level": "SENIOR",
                "department_id": self.backend_department.id,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
