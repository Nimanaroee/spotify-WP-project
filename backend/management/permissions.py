from rest_framework.permissions import BasePermission


class IsSupportOrAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role in (user.Role.SUPPORT, user.Role.ADMIN)
        )


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == user.Role.ADMIN)
