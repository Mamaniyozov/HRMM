import django.db.models.deletion
from django.db import migrations, models


def mark_existing_requests_pending(apps, schema_editor):
    Notification = apps.get_model("notifications", "Notification")
    Notification.objects.filter(
        reference_type__in=["FEATURE_REQUEST", "USER_NOTIFICATION"],
        status__isnull=True,
    ).update(status="PENDING")


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0004_notification_notification_number"),
        ("users", "0011_force_repair_role_schema"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("PENDING", "Pending"),
                    ("APPROVED", "Approved"),
                    ("REJECTED", "Rejected"),
                ],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="notification",
            name="review_comment",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="notification",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                db_column="reviewed_by",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="reviewed_notifications",
                to="users.user",
            ),
        ),
        migrations.AddField(
            model_name="notification",
            name="submitted_by",
            field=models.ForeignKey(
                blank=True,
                db_column="submitted_by",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="submitted_notifications",
                to="users.user",
            ),
        ),
        migrations.RunPython(mark_existing_requests_pending, migrations.RunPython.noop),
    ]
