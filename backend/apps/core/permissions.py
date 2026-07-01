"""Core permission stubs
Spec reference: <phase1.md section> | core permissions

Responsibilities (TODO):
    - [ ] IsAdmin, IsSupportOrAdmin, IsVerifiedArtist, IsOwnerOrReadOnly

Notes: stub implementations returning NotImplemented for now
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return False


class IsSupportOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return False


class IsVerifiedArtist(permissions.BasePermission):
    def has_permission(self, request, view):
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS
