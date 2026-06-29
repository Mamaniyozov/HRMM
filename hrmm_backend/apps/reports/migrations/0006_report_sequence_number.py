from django.db import migrations, models


def create_sequence_and_backfill(apps, schema_editor):
    if schema_editor.connection.vendor == "sqlite":
        # SQLite doesn't support SEQUENCE — Report.save() has a fallback
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("CREATE SEQUENCE IF NOT EXISTS report_sequence_number_seq START 1 INCREMENT 1;")
        cursor.execute("""
            WITH numbered AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
                FROM reports_report
                WHERE sequence_number IS NULL
            )
            UPDATE reports_report
            SET sequence_number = numbered.rn
            FROM numbered
            WHERE reports_report.id = numbered.id;
        """)
        cursor.execute("""
            SELECT setval(
                'report_sequence_number_seq',
                COALESCE((SELECT MAX(sequence_number) FROM reports_report), 0)
            );
        """)


def drop_sequence(apps, schema_editor):
    if schema_editor.connection.vendor == "sqlite":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("DROP SEQUENCE IF EXISTS report_sequence_number_seq;")


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0005_report_is_deleted"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="sequence_number",
            field=models.PositiveIntegerField(null=True, blank=True),
        ),
        migrations.RunPython(create_sequence_and_backfill, drop_sequence),
        migrations.AlterField(
            model_name="report",
            name="sequence_number",
            field=models.PositiveIntegerField(null=True, blank=True, unique=True),
        ),
    ]
