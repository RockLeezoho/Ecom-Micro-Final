import logging
from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)

class IsStaffOrAdminUser(BasePermission):
    """
    Allows access only to users with is_staff=True or is_superuser=True (admin).
    """
    def has_permission(self, request, view):
        is_authenticated = bool(request.user and request.user.is_authenticated)
        is_staff = bool(request.user and getattr(request.user, 'is_staff', False)) if is_authenticated else False
        is_superuser = bool(request.user and getattr(request.user, 'is_superuser', False)) if is_authenticated else False
        
        logger.debug(f"[IsStaffOrAdminUser] user={request.user}, is_authenticated={is_authenticated}, is_staff={is_staff}, is_superuser={is_superuser}")
        
        allowed = is_authenticated and (is_staff or is_superuser)
        logger.debug(f"[IsStaffOrAdminUser] Permission allowed: {allowed}")
        
        return allowed
