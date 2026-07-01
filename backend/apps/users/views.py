"""User views (stubs)

Spec reference: <phase1.md section> | users

Responsibilities (TODO):
    - [ ] RegisterView, MeView, ProfileView, FollowToggleView
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class RegisterView(APIView):
    def post(self, request):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class MeView(APIView):
    def get(self, request):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class ProfileView(APIView):
    def get(self, request, username):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class FollowToggleView(APIView):
    def post(self, request, username):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
