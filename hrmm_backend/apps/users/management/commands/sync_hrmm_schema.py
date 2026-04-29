from django.core.management.base import BaseCommand
from django.db import connection, transaction

from apps.departments.models import Department
from apps.units.models import Unit
from apps.users.models import User


ROLE_MAP = {
    "SPECIALIST": "SPECIALIST",
    "UNIT_HEAD": "UNIT_HEAD",
    "DEPT_HEAD": "DEPT_HEAD",
    "DIRECTOR": "DIRECTOR",
}

JOB_ROLE_BY_DEPARTMENT = {
    "BACK": "BACKEND_DEV",
    "DEVOPS": "DEVOPS",
    "QA": "IT_ENGINEER",
    "MOBILE": "ANDROID_DEV",
    "DATA": "IT_ENGINEER",
    "PM": "MANAGER",
}


class Command(BaseCommand):
    help = "Sync hrmm schema data into Django public tables used by the backend."

    def handle(self, *args, **options):
        if not self._table_exists("hrmm", "departments"):
            self.stdout.write(self.style.WARNING("`hrmm.departments` topilmadi. Sync qilinmadi."))
            return

        with transaction.atomic():
            departments = self._fetchall(
                """
                SELECT id, name, code, COALESCE(is_active, TRUE) AS is_active
                FROM hrmm.departments
                ORDER BY created_at, name
                """
            )
            self._sync_departments(departments)

            if self._table_exists("hrmm", "units"):
                units = self._fetchall(
                    """
                    SELECT id, department_id, name, code, COALESCE(is_active, TRUE) AS is_active
                    FROM hrmm.units
                    ORDER BY created_at, name
                    """
                )
                self._sync_units(units)
            else:
                self.stdout.write(self.style.WARNING("`hrmm.units` topilmadi, units sync o'tkazib yuborildi."))

            if self._table_exists("hrmm", "users"):
                users = self._fetchall(
                    """
                    SELECT id, username, email, password_hash, full_name, role,
                           department_id, unit_id, COALESCE(is_active, TRUE) AS is_active,
                           phone, avatar_url, last_login_at
                    FROM hrmm.users
                    ORDER BY created_at, username
                    """
                )
                self._sync_users(users)
            else:
                self.stdout.write(self.style.WARNING("`hrmm.users` topilmadi, users sync o'tkazib yuborildi."))

        self.stdout.write(self.style.SUCCESS("hrmm -> public sync yakunlandi."))
        self.stdout.write(f"Departments: {Department.objects.count()}")
        self.stdout.write(f"Units: {Unit.objects.count()}")
        self.stdout.write(f"Users: {User.objects.count()}")

    def _table_exists(self, schema_name, table_name):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = %s AND table_name = %s
                )
                """,
                [schema_name, table_name],
            )
            return cursor.fetchone()[0]

    def _fetchall(self, sql):
        with connection.cursor() as cursor:
            cursor.execute(sql)
            columns = [column[0] for column in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def _sync_departments(self, rows):
        for row in rows:
            Department.objects.update_or_create(
                id=row["id"],
                defaults={
                    "name": row["name"],
                    "code": row["code"],
                    "is_active": row["is_active"],
                },
            )

    def _sync_units(self, rows):
        for row in rows:
            department = Department.objects.filter(id=row["department_id"]).first()
            if not department:
                self.stdout.write(self.style.WARNING(f"Unit `{row['code']}` uchun department topilmadi, skip."))
                continue
            Unit.objects.update_or_create(
                id=row["id"],
                defaults={
                    "department_id": department,
                    "name": row["name"],
                    "code": row["code"],
                    "is_active": row["is_active"],
                },
            )

    def _sync_users(self, rows):
        for row in rows:
            department = Department.objects.filter(id=row["department_id"]).first() if row["department_id"] else None
            unit = Unit.objects.filter(id=row["unit_id"]).first() if row["unit_id"] else None
            role = ROLE_MAP.get(row["role"], "SPECIALIST")
            job_role = JOB_ROLE_BY_DEPARTMENT.get(department.code) if department else None
            if role == "DIRECTOR":
                job_role = "DIRECTOR"

            User.objects.update_or_create(
                id=row["id"],
                defaults={
                    "username": row["username"],
                    "email": row["email"],
                    "password_hash": row["password_hash"],
                    "full_name": row["full_name"],
                    "role": role,
                    "job_role": job_role,
                    "department_id": department,
                    "unit_id": unit,
                    "is_active": row["is_active"],
                    "phone": row["phone"],
                    "avatar_url": row["avatar_url"],
                    "last_login_at": row["last_login_at"],
                },
            )
