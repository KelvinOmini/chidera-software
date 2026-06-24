from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages


def role_required(allowed_roles):
    """
    Decorator to check if user has required role.
    
    Args:
        allowed_roles: List of allowed roles or single role string
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                messages.error(request, 'You must be logged in to access this page.')
                return redirect('accounts:login')
            
            if request.user.role not in allowed_roles:
                messages.error(request, 'You do not have permission to access this page.')
                return redirect('dashboard:home')
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def admin_required(view_func):
    """Decorator to require admin role."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.error(request, 'You must be logged in.')
            return redirect('accounts:login')
        
        if not request.user.is_admin():
            messages.error(request, 'Admin access required.')
            return redirect('dashboard:home')
        
        return view_func(request, *args, **kwargs)
    return wrapper


def manager_required(view_func):
    """Decorator to require manager or admin role."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.error(request, 'You must be logged in.')
            return redirect('accounts:login')
        
        if not request.user.can_manage_inventory():
            messages.error(request, 'Manager access required.')
            return redirect('dashboard:home')
        
        return view_func(request, *args, **kwargs)
    return wrapper
