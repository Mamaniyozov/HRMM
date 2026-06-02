from django.db import migrations

from apps.users.db_migration import forwards_postgres_sql

POSTGRES_REPAIR_ROLE = """
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users_user'
      AND column_name = 'role'
      AND udt_name = 'status_enum'
  ) THEN
    ALTER TABLE public.users_user
      ALTER COLUMN role TYPE varchar(20)
      USING role::text;
  END IF;
END $$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0009_add_director_to_status_enum"),
    ]

    operations = [
        migrations.RunPython(
            forwards_postgres_sql(POSTGRES_REPAIR_ROLE),
            migrations.RunPython.noop,
        ),
    ]
