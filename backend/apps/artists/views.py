"""Artist views (stubs)"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class ArtistProfileView(APIView):
    def get(self, request, pk=None):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class ArtistVerificationRequestListView(APIView):
    def get(self, request):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class ArtistVerificationDecisionView(APIView):
    def post(self, request, pk):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
