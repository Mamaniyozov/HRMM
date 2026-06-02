from django.db import migrations

from apps.users.db_migration import forwards_postgres_sql


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_fix_role_enum"),
    ]

    operations = [
        migrations.RunPython(
            forwards_postgres_sql("ALTER TYPE status_enum ADD VALUE IF NOT EXISTS 'DIRECTOR';"),
            migrations.RunPython.noop,
        ),
    ]
