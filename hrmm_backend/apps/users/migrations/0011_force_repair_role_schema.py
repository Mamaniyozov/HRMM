from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0010_repair_user_role_column_type"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
DO $$
BEGIN
  -- 1) If status_enum exists but misses DIRECTOR, add it.
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

  -- 2) If users_user.role is still tied to status_enum, convert it to varchar.
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
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
