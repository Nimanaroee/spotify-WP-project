from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class AlbumViewSet(ReadOnlyModelViewSet):
    pass


class TrackViewSet(ReadOnlyModelViewSet):
    pass


class StreamEventCreateView(APIView):
    def post(self, request):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
