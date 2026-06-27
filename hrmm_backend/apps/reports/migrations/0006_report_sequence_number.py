from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0005_report_is_deleted"),
    ]

    operations = [
        # 1. Add the field as nullable first (no default, no unique yet)
        migrations.AddField(
            model_name="report",
            name="sequence_number",
            field=models.PositiveIntegerField(null=True, blank=True),
        ),
        # 2. Create SEQUENCE, backfill existing rows, set SEQUENCE start value
        migrations.RunSQL(
            sql=[
                "CREATE SEQUENCE IF NOT EXISTS report_sequence_number_seq START 1 INCREMENT 1;",
                """
                WITH numbered AS (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
                    FROM reports_report
                    WHERE sequence_number IS NULL
                )
                UPDATE reports_report
                SET sequence_number = numbered.rn
                FROM numbered
                WHERE reports_report.id = numbered.id;
                """,
                """
                SELECT setval(
                    'report_sequence_number_seq',
                    COALESCE((SELECT MAX(sequence_number) FROM reports_report), 0)
                );
                """,
            ],
            reverse_sql=[
                "DROP SEQUENCE IF EXISTS report_sequence_number_seq;",
            ],
        ),
        # 3. Enforce unique constraint after backfill
        migrations.AlterField(
            model_name="report",
            name="sequence_number",
            field=models.PositiveIntegerField(null=True, blank=True, unique=True),
        ),
    ]
