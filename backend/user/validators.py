from django.conf import settings
from django.core.exceptions import ValidationError

def validate_image_size(file):
    if file.size > settings.USER_MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(
            f"Image file size must be under {settings.USER_MAX_IMAGE_SIZE_MB}MB."
        )
