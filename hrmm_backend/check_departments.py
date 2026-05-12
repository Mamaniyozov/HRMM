import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.departments.models import Department

print('Departments count:', Department.objects.count())
print('Departments:')
for d in Department.objects.all():
    print(f'  - {d.name} ({d.code})')
