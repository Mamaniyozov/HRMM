from django.db import migrations, models

from apps.users.db_migration import forwards_postgres_sql

POSTGRES_FIX_ROLE = """
ALTER TABLE users_user ALTER COLUMN role TYPE varchar(20) USING role::text;
DROP TYPE IF EXISTS status_enum;
"""


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_user_language_user_two_factor_secret_and_more"),
    ]

    operations = [
        migrations.RunPython(
            forwards_postgres_sql(POSTGRES_FIX_ROLE),
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("SPECIALIST", "Specialist"),
                    ("UNIT_HEAD", "Unit Head"),
                    ("DEPT_HEAD", "Department Head"),
                    ("DIRECTOR", "Director"),
                ],
                default="SPECIALIST",
                max_length=20,
            ),
        ),
    ]
