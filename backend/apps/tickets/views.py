from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class TicketListView(APIView):
    def get(self, request):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class TicketDetailView(APIView):
    def get(self, request, pk):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)


class TicketMessageCreateView(APIView):
    def post(self, request, pk):
        return Response({'detail': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)
