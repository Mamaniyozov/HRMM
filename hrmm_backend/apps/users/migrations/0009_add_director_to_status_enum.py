from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_fix_role_enum"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
