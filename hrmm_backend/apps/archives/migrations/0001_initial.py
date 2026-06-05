import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ArchiveLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("archived_at", models.DateTimeField(auto_now_add=True)),
                ("record_count", models.PositiveIntegerField(default=0)),
                ("file_size_kb", models.PositiveIntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[("success", "Success"), ("failed", "Failed")],
                        max_length=20,
                    ),
                ),
                ("error_message", models.TextField(blank=True, default="")),
            ],
            options={
                "ordering": ("-archived_at",),
                "indexes": [
                    models.Index(fields=["-archived_at"], name="idx_archive_log_archived_at")
                ],
            },
        ),
    ]
