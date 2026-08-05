from rest_framework.permissions import BasePermission
from user.models import User


class IsVerifiedArtist(BasePermission):
    message = "Only verified artists can manage releases."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.role == User.Role.ARTIST):
            return False
        
        if hasattr(user, "artist"):
            return user.artist.is_approved()
        return False