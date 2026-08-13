import os
from django.core.exceptions import ValidationError

MAX_AUDIO_SIZE_MB = 10
MAX_IMAGE_SIZE_MB = 5
ALLOWED_AUDIO_EXTS = ['.mp3', '.wav', '.flac']

def validate_audio_file(file):
    if file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"Audio file size must be under {MAX_AUDIO_SIZE_MB}MB.")
    
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_AUDIO_EXTS:
        raise ValidationError(f"Unsupported file extension. Allowed extensions are: {', '.join(ALLOWED_AUDIO_EXTS)}")

def validate_image_size(file):
    if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"Image file size must be under {MAX_IMAGE_SIZE_MB}MB.")