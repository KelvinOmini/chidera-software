import os
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings


class Command(BaseCommand):
    help = 'Loads sample fixtures (users, categories, suppliers, items, transactions) in the correct order.'

    def handle(self, *args, **kwargs):
        fixtures_dir = os.path.join(settings.BASE_DIR, 'fixtures')
        
        if not os.path.exists(fixtures_dir):
            self.stdout.write(self.style.ERROR(f'Fixtures directory not found at {fixtures_dir}'))
            return
            
        # Order matters due to foreign key relationships
        fixtures = [
            'users.json',
            'categories.json',
            'suppliers.json',
            'items.json',
            'transactions.json',
        ]
        
        self.stdout.write(self.style.NOTICE('Starting data load...'))
        
        for fixture in fixtures:
            fixture_path = os.path.join(fixtures_dir, fixture)
            if not os.path.exists(fixture_path):
                self.stdout.write(self.style.WARNING(f'Fixture file not found: {fixture}'))
                continue
                
            self.stdout.write(f'Loading {fixture}...')
            try:
                call_command('loaddata', fixture_path)
                self.stdout.write(self.style.SUCCESS(f'Successfully loaded {fixture}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to load {fixture}: {str(e)}'))
                # Stop if users fail, since everything else depends on them
                if fixture == 'users.json':
                    self.stdout.write(self.style.ERROR('Cannot proceed without users data.'))
                    break
        
        self.stdout.write(self.style.SUCCESS('\nSample data loading complete!'))
        self.stdout.write(self.style.NOTICE('You can login with:'))
        self.stdout.write(self.style.NOTICE('- admin / pbkdf2_sha256$600000$salt$hash (Note: You may want to use createsuperuser for a known password)'))
        self.stdout.write(self.style.NOTICE('Or run: python manage.py createsuperuser'))

