from apps.departments.models import Department

print('Checking departments in database...')
count = Department.objects.count()
print(f'Departments count: {count}')
print('\nAll departments:')
for d in Department.objects.all():
    print(f'  - {d.name} ({d.code}) - Active: {d.is_active}')

if count == 0:
    print('\nNo departments found. Creating default departments...')
    default_departments = [
        {"name": "IT Department", "code": "IT"},
        {"name": "HR Department", "code": "HR"},
        {"name": "Finance Department", "code": "FIN"},
        {"name": "Marketing Department", "code": "MKT"},
        {"name": "Operations Department", "code": "OPS"},
    ]
    for dept_data in default_departments:
        Department.objects.create(**dept_data)
    print(f'Created {len(default_departments)} default departments.')
