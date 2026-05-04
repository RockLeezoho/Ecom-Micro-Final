from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    """Allow access only to staff or admin-role users."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # prefer Django staff flag, fall back to role attribute
        if getattr(user, 'is_staff', False):
            return True
        return getattr(user, 'role', None) in {'staff', 'admin'}


class IsAdminRole(BasePermission):
    """Allow access only to admin-role users."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, 'role', None) == 'admin'
