from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0009_add_director_to_status_enum"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
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
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
