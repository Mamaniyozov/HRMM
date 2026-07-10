from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0007_alter_report_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='priority',
            field=models.CharField(
                choices=[('LOW', 'Past'), ('NORMAL', 'Oddiy'), ('HIGH', 'Yuqori'), ('CRITICAL', 'Kritik')],
                default='NORMAL',
                max_length=10,
            ),
        ),
    ]
