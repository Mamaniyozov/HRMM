from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_fix_role_enum"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TYPE status_enum ADD VALUE IF NOT EXISTS 'DIRECTOR';",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
