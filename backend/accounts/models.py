from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """Extended User model with role-based access control."""
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Inventory Manager'),
        ('staff', 'Staff'),
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='staff',
        help_text='User role for access control'
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text='Designates whether this user should be treated as active.'
    )
    
    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_created']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
    
    def is_admin(self):
        """Check if user is admin."""
        return self.role == 'admin'
    
    def is_manager(self):
        """Check if user is manager."""
        return self.role == 'manager'
    
    def is_staff_user(self):
        """Check if user is staff."""
        return self.role == 'staff'
    
    def can_manage_inventory(self):
        """Check if user can manage inventory."""
        return self.role in ['admin', 'manager']
    
    def can_view_reports(self):
        """Check if user can view reports."""
        return self.role in ['admin', 'manager']
    
    def can_manage_users(self):
        """Check if user can manage users."""
        return self.role == 'admin'
