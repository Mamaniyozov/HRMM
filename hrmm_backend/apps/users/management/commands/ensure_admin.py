from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import identify_hasher, make_password
from django.core.management.base import BaseCommand

from apps.users.models import User as AppUser


def needs_password_hash(value):
    if not value:
        return True
    try:
        identify_hasher(value)
        return False
    except ValueError:
        return True


class Command(BaseCommand):
    help = "Create or repair the default admin accounts used by deployments."

    def handle(self, *args, **options):
        admin_username = "admin"
        admin_email = "admin@example.com"
        admin_password = "admin123"

        django_admin_model = get_user_model()
        django_admin, django_created = django_admin_model.objects.get_or_create(
            username=admin_username,
            defaults={"email": admin_email, "is_staff": True, "is_superuser": True},
        )
        if django_created or not django_admin.check_password(admin_password):
            django_admin.email = django_admin.email or admin_email
            django_admin.is_staff = True
            django_admin.is_superuser = True
            django_admin.set_password(admin_password)
            django_admin.save()

        app_admin, app_created = AppUser.objects.get_or_create(
            username=admin_username,
            defaults={
                "email": admin_email,
                "full_name": "System Admin",
                "password_hash": make_password(admin_password),
                "role": "DIRECTOR",
                "is_active": True,
            },
        )

        update_fields = []
        if app_admin.email != admin_email:
            app_admin.email = admin_email
            update_fields.append("email")
        if app_admin.full_name != "System Admin":
            app_admin.full_name = "System Admin"
            update_fields.append("full_name")
        if app_admin.role != "DIRECTOR":
            app_admin.role = "DIRECTOR"
            update_fields.append("role")
        if not app_admin.is_active:
            app_admin.is_active = True
            update_fields.append("is_active")
        if app_created or needs_password_hash(app_admin.password_hash):
            app_admin.password_hash = make_password(admin_password)
            update_fields.append("password_hash")

        if update_fields:
            app_admin.save(update_fields=[*set(update_fields), "updated_at"])

        self.stdout.write(self.style.SUCCESS("Default admin accounts are ready."))
