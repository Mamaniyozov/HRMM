from django.db import migrations, models
import apps.notifications.models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="notification",
            name="screenshot",
            field=models.FileField(blank=True, null=True, upload_to=apps.notifications.models.notification_attachment_upload_to),
        ),
    ]
