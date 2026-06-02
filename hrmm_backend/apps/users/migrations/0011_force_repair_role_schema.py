from django.db import migrations

from apps.users.db_migration import forwards_postgres_sql

POSTGRES_FORCE_REPAIR = """
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'status_enum'
        AND e.enumlabel = 'DIRECTOR'
    ) THEN
      EXECUTE 'ALTER TYPE status_enum ADD VALUE ''DIRECTOR''';
    END IF;
  END IF;

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
        ("users", "0010_repair_user_role_column_type"),
    ]

    operations = [
        migrations.RunPython(
            forwards_postgres_sql(POSTGRES_FORCE_REPAIR),
            migrations.RunPython.noop,
        ),
    ]
