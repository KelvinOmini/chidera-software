from django.core.management.base import BaseCommand
from accounts.models import CustomUser

class Command(BaseCommand):
    help = 'Creates initial demo users for testing'

    def handle(self, *args, **kwargs):
        users_data = [
            {'username': 'admin', 'email': 'admin@inventorysystem.com', 'password': 'admin123', 'role': 'admin', 'is_superuser': True, 'is_staff': True},
            {'username': 'manager', 'email': 'manager@inventorysystem.com', 'password': 'manager123', 'role': 'manager', 'is_superuser': False, 'is_staff': False},
            {'username': 'staff', 'email': 'staff@inventorysystem.com', 'password': 'staff123', 'role': 'staff', 'is_superuser': False, 'is_staff': False},
        ]
        
        for user_info in users_data:
            user, created = CustomUser.objects.get_or_create(
                username=user_info['username'],
                defaults={
                    'email': user_info['email'],
                    'role': user_info['role'],
                    'is_superuser': user_info['is_superuser'],
                    'is_staff': user_info['is_staff'],
                }
            )
            user.set_password(user_info['password'])
            user.role = user_info['role']
            user.is_superuser = user_info['is_superuser']
            user.is_staff = user_info['is_staff']
            user.save()
            
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f'{action} demo user: {user.username} (role: {user.role})'))
