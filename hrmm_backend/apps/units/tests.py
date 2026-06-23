from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.departments.models import Department
from apps.units.models import Unit
from apps.users.models import User


class UnitPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name="Engineering", code="ENG")
        self.users = {}
        for role in ("SPECIALIST", "UNIT_HEAD", "DEPT_HEAD", "DIRECTOR"):
            self.users[role] = User.objects.create(
                username=f"{role.lower()}_unit",
                email=f"{role.lower()}_unit@example.com",
                password_hash="password123",
                full_name=f"{role} Unit",
                role=role,
                department_id=self.department,
            )

    def _auth(self, role):
        self.client.force_authenticate(user=self.users[role])

    def test_all_authenticated_roles_can_list_units(self):
        Unit.objects.create(department_id=self.department, name="Backend", code="BE")
        for role in ("SPECIALIST", "UNIT_HEAD", "DEPT_HEAD", "DIRECTOR"):
            with self.subTest(role=role):
                self._auth(role)
                response = self.client.get("/api/v1/units/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertGreaterEqual(response.data["count"], 1)

    def test_non_director_cannot_create_unit(self):
        for role in ("SPECIALIST", "UNIT_HEAD", "DEPT_HEAD"):
            with self.subTest(role=role):
                self._auth(role)
                response = self.client.post(
                    "/api/v1/units/",
                    {
                        "department_id": str(self.department.id),
                        "name": f"New {role} Unit",
                        "code": f"NU{role[:1]}",
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_director_can_create_unit(self):
        self._auth("DIRECTOR")
        response = self.client.post(
            "/api/v1/units/",
            {
                "department_id": str(self.department.id),
                "name": "QA Unit",
                "code": "QAU",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertTrue(
            AuditLog.objects.filter(
                action="UNIT_CREATE", target_type="units.Unit"
            ).exists()
        )

    def test_director_can_update_unit(self):
        unit = Unit.objects.create(department_id=self.department, name="Backend", code="BE")
        self._auth("DIRECTOR")
        response = self.client.put(
            f"/api/v1/units/{unit.id}/",
            {"name": "Backend Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unit.refresh_from_db()
        self.assertEqual(unit.name, "Backend Updated")
        self.assertTrue(
            AuditLog.objects.filter(
                action="UNIT_UPDATE", target_type="units.Unit"
            ).exists()
        )

    def test_director_can_delete_unit(self):
        unit = Unit.objects.create(department_id=self.department, name="Frontend", code="FE")
        self._auth("DIRECTOR")
        response = self.client.delete(f"/api/v1/units/{unit.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        unit.refresh_from_db()
        self.assertFalse(unit.is_active)
        self.assertTrue(
            AuditLog.objects.filter(
                action="UNIT_DELETE", target_type="units.Unit"
            ).exists()
        )

    def test_non_director_cannot_update_unit(self):
        unit = Unit.objects.create(department_id=self.department, name="Mobile", code="MOB")
        self._auth("DEPT_HEAD")
        response = self.client.put(
            f"/api/v1/units/{unit.id}/",
            {"name": "Hacked Unit"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        unit.refresh_from_db()
        self.assertEqual(unit.name, "Mobile")

    def test_non_director_cannot_delete_unit(self):
        unit = Unit.objects.create(department_id=self.department, name="DevOps", code="DO")
        self._auth("UNIT_HEAD")
        response = self.client.delete(f"/api/v1/units/{unit.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        unit.refresh_from_db()
        self.assertTrue(unit.is_active)
