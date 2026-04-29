from django.db import migrations, models

import apps.notifications.models


class Migration(migrations.Migration):
    dependencies = [
        ("notifications", "0002_notification_screenshot"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="screenshot",
            field=models.FileField(
                blank=True,
                max_length=255,
                null=True,
                upload_to=apps.notifications.models.notification_attachment_upload_to,
            ),
        ),
    ]
