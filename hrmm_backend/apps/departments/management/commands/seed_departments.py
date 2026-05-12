from django.core.management.base import BaseCommand
from apps.departments.models import Department


class Command(BaseCommand):
    help = 'Check and seed default departments if none exist'

    def handle(self, *args, **options):
        count = Department.objects.count()
        self.stdout.write(f'Departments count: {count}')
        
        if count == 0:
            self.stdout.write(self.style.WARNING('No departments found. Creating default departments...'))
            default_departments = [
                {"name": "IT Department", "code": "IT"},
                {"name": "HR Department", "code": "HR"},
                {"name": "Finance Department", "code": "FIN"},
                {"name": "Marketing Department", "code": "MKT"},
                {"name": "Operations Department", "code": "OPS"},
            ]
            for dept_data in default_departments:
                Department.objects.create(**dept_data)
                self.stdout.write(f'  Created: {dept_data["name"]} ({dept_data["code"]})')
            self.stdout.write(self.style.SUCCESS(f'Created {len(default_departments)} default departments.'))
        else:
            self.stdout.write(self.style.SUCCESS('Departments already exist:'))
            for d in Department.objects.all():
                self.stdout.write(f'  - {d.name} ({d.code}) - Active: {d.is_active}')
