from django.db import migrations, models
import apps.leave_management.models


class Migration(migrations.Migration):

    dependencies = [
        ("leave_management", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="leaverequest",
            name="screenshot",
            field=models.FileField(blank=True, null=True, upload_to=apps.leave_management.models.leave_screenshot_upload_to),
        ),
    ]
