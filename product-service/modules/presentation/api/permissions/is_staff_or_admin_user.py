from rest_framework.permissions import BasePermission

class IsStaffOrAdminUser(BasePermission):
    """
    Allows access only to users with is_staff=True or is_superuser=True (admin).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))
