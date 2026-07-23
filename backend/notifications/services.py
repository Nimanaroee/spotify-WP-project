from .models import Notification


def notify_user(recipient, category, title, message="", link=""):
    return Notification.objects.create(
        recipient=recipient,
        category=category,
        title=title,
        message=message,
        link=link,
    )


def notify_staff(category, title, message="", link=""):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    staff = User.objects.filter(role__in=(User.Role.SUPPORT, User.Role.ADMIN))
    Notification.objects.bulk_create(
        Notification(
            recipient=user,
            category=category,
            title=title,
            message=message,
            link=link,
        )
        for user in staff
    )
