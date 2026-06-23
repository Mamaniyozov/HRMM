from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.departments.models import Department
from apps.users.models import User


class DepartmentPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name="Engineering", code="ENG")
        self.users = {}
        for role in ("SPECIALIST", "UNIT_HEAD", "DEPT_HEAD", "DIRECTOR"):
            self.users[role] = User.objects.create(
                username=f"{role.lower()}_dept",
                email=f"{role.lower()}_dept@example.com",
                password_hash="password123",
                full_name=f"{role} Dept",
                role=role,
                department_id=self.department,
            )

    def _auth(self, role):
        self.client.force_authenticate(user=self.users[role])

    def test_all_authenticated_roles_can_list_departments(self):
        for role in ("SPECIALIST", "UNIT_HEAD", "DEPT_HEAD", "DIRECTOR"):
            with self.subTest(role=role):
                self._auth(role)
                response = self.client.get("/api/v1/departments/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertGreaterEqual(response.data["count"], 1)

    def test_non_director_cannot_create_department(self):
        for role in ("SPECIALIST", "UNIT_HEAD", "DEPT_HEAD"):
            with self.subTest(role=role):
                self._auth(role)
                response = self.client.post(
                    "/api/v1/departments/",
                    {"name": f"New {role} Department", "code": f"ND{role[:1]}"},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_director_can_create_department(self):
        self._auth("DIRECTOR")
        response = self.client.post(
            "/api/v1/departments/",
            {"name": "QA Department", "code": "QA"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertTrue(
            AuditLog.objects.filter(
                action="DEPARTMENT_CREATE", target_type="departments.Department"
            ).exists()
        )

    def test_director_can_update_department(self):
        self._auth("DIRECTOR")
        response = self.client.put(
            f"/api/v1/departments/{self.department.id}/",
            {"name": "Engineering Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.department.refresh_from_db()
        self.assertEqual(self.department.name, "Engineering Updated")
        self.assertTrue(
            AuditLog.objects.filter(
                action="DEPARTMENT_UPDATE", target_type="departments.Department"
            ).exists()
        )

    def test_director_can_delete_department(self):
        self._auth("DIRECTOR")
        response = self.client.delete(f"/api/v1/departments/{self.department.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.department.refresh_from_db()
        self.assertFalse(self.department.is_active)
        self.assertTrue(
            AuditLog.objects.filter(
                action="DEPARTMENT_DELETE", target_type="departments.Department"
            ).exists()
        )

    def test_non_director_cannot_update_department(self):
        self._auth("SPECIALIST")
        response = self.client.put(
            f"/api/v1/departments/{self.department.id}/",
            {"name": "Hacked Department"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.department.refresh_from_db()
        self.assertEqual(self.department.name, "Engineering")

    def test_non_director_cannot_delete_department(self):
        self._auth("UNIT_HEAD")
        response = self.client.delete(f"/api/v1/departments/{self.department.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.department.refresh_from_db()
        self.assertTrue(self.department.is_active)
