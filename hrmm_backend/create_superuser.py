import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

username = os.getenv('SUPERUSER_USERNAME', 'admin')
email = os.getenv('SUPERUSER_EMAIL', 'admin@admin.com')
password = os.getenv('SUPERUSER_PASSWORD', 'admin123')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created!")
else:
    print(f"Superuser '{username}' already exists.")