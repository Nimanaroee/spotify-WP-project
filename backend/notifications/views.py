from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import schema
from .models import Notification
from .serializers import NotificationSerializer


@extend_schema(
    tags=schema.NOTIFICATIONS_TAG,
    summary="List my notifications",
    description="Returns all notifications for the authenticated user, newest first. Not paginated.",
    responses={200: NotificationSerializer(many=True)},
)
class NotificationListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = NotificationSerializer
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


@extend_schema(
    tags=schema.NOTIFICATIONS_TAG,
    summary="Mark a notification as read",
    request=None,
    responses={200: NotificationSerializer, 404: schema.NOT_FOUND_RESPONSE},
)
class NotificationMarkReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        notification = Notification.objects.filter(recipient=request.user, pk=pk).first()
        if notification is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=("is_read",))
        return Response(NotificationSerializer(notification).data)


@extend_schema(
    tags=schema.NOTIFICATIONS_TAG,
    summary="Mark all my notifications as read",
    request=None,
    responses={204: None},
)
class NotificationMarkAllReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=schema.NOTIFICATIONS_TAG,
    summary="Delete a notification",
    responses={204: None, 404: schema.NOT_FOUND_RESPONSE},
)
class NotificationDeleteView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk):
        deleted, _ = Notification.objects.filter(recipient=request.user, pk=pk).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
