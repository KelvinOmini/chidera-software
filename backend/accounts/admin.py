from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .forms import CustomUserCreationForm, CustomUserChangeForm


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Admin interface for CustomUser model."""
    
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_created')
    list_filter = ('role', 'is_active', 'date_created')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_created',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Role', {'fields': ('role',)}),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'date_created', 'date_modified')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ('date_created', 'date_modified', 'last_login', 'date_joined')
