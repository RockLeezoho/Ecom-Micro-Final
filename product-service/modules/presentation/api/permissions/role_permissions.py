from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffOrAdminRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and getattr(user, "is_authenticated", False)
            and getattr(user, "role", None) in ("staff", "admin")
        )


class ReadOnlyOrStaffOrAdminRole(BasePermission):
    """
    Allow unauthenticated read-only access, but require staff/admin for writes.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and getattr(user, "is_authenticated", False)
            and getattr(user, "role", None) in ("staff", "admin")
        )

