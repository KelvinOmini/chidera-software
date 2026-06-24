from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users."""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin()
        )


class IsManagerOrAdmin(BasePermission):
    """Allow access to managers and admins."""
    
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.can_manage_inventory()
        )


class IsReadOnlyOrManager(BasePermission):
    """Allow read-only access to all authenticated users, write access to managers/admins."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.can_manage_inventory()
