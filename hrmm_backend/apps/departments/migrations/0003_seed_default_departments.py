# Generated migration to seed default departments

from django.db import migrations


def seed_default_departments(apps, schema_editor):
    Department = apps.get_model("departments", "Department")

    # Keep the migration idempotent: if departments already exist, don't duplicate them.
    if Department.objects.exists():
        return

    # Create default departments
    default_departments = [
        {
            "name": "IT Department",
            "code": "IT",
        },
        {
            "name": "HR Department",
            "code": "HR",
        },
        {
            "name": "Finance Department",
            "code": "FIN",
        },
        {
            "name": "Marketing Department",
            "code": "MKT",
        },
        {
            "name": "Operations Department",
            "code": "OPS",
        },
    ]

    for dept_data in default_departments:
        Department.objects.create(**dept_data)


class Migration(migrations.Migration):
    dependencies = [
        ("departments", "0002_alter_department_head_user_id"),
    ]

    operations = [
        migrations.RunPython(seed_default_departments, migrations.RunPython.noop),
    ]
