from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_user_job_level_user_job_role"),
        ("reports", "0005_report_is_deleted"),
        ("leave_management", "0001_initial"),
        ("workflows", "0001_initial"),
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='hrmm' AND t.typname='status_enum'
  ) THEN
    CREATE TYPE hrmm.status_enum AS ENUM (
      'DRAFT','PENDING_L2','PENDING_L3','PENDING_L4',
      'APPROVED','REJECTED','REVISION','ARCHIVED'
    );
  END IF;
END $$;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='hrmm' AND t.typname='leave_type_enum'
  ) THEN
    CREATE TYPE hrmm.leave_type_enum AS ENUM ('ANNUAL','SICK','MATERNITY','UNPAID','OTHER');
  END IF;
END $$;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='hrmm' AND t.typname='leave_status_enum'
  ) THEN
    CREATE TYPE hrmm.leave_status_enum AS ENUM ('PENDING','APPROVED','REJECTED','CANCELLED');
  END IF;
END $$;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='hrmm' AND t.typname='action_enum'
  ) THEN
    CREATE TYPE hrmm.action_enum AS ENUM ('SUBMIT','APPROVE','REJECT','REQUEST_REVISION','ARCHIVE');
  END IF;
END $$;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='hrmm' AND t.typname='notif_type_enum'
  ) THEN
    CREATE TYPE hrmm.notif_type_enum AS ENUM ('APPROVAL','REJECTION','INFO','REMINDER');
  END IF;
END $$;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
ALTER TABLE public.users_user
  ALTER COLUMN role TYPE hrmm.role_enum
  USING role::text::hrmm.role_enum;

ALTER TABLE public.reports_report
  ALTER COLUMN status TYPE hrmm.status_enum
  USING status::text::hrmm.status_enum;

ALTER TABLE public.leave_management_leaverequest
  ALTER COLUMN leave_type TYPE hrmm.leave_type_enum
  USING leave_type::text::hrmm.leave_type_enum;

ALTER TABLE public.leave_management_leaverequest
  ALTER COLUMN status TYPE hrmm.leave_status_enum
  USING status::text::hrmm.leave_status_enum;

ALTER TABLE public.workflows_approvalhistory
  ALTER COLUMN action TYPE hrmm.action_enum
  USING action::text::hrmm.action_enum;

ALTER TABLE public.workflows_approvalhistory
  ALTER COLUMN previous_status TYPE hrmm.status_enum
  USING previous_status::text::hrmm.status_enum;

ALTER TABLE public.workflows_approvalhistory
  ALTER COLUMN new_status TYPE hrmm.status_enum
  USING new_status::text::hrmm.status_enum;

ALTER TABLE public.notifications_notification
  ALTER COLUMN type TYPE hrmm.notif_type_enum
  USING type::text::hrmm.notif_type_enum;
""",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

