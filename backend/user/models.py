from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        LISTENER = "listener", "Listener"
        ARTIST = "artist", "Artist"
        SUPPORT = "support", "Support"
        ADMIN = "admin", "Admin"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    class SubscriptionTier(models.TextChoices):
        BASIC = "basic", "Basic"
        SILVER = "silver", "Silver"
        GOLD = "gold", "Gold"

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.LISTENER)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        null=True,
        blank=True,
    )
    profile_picture = models.ImageField(upload_to="profile-pictures/", null=True, blank=True)
    subscription_tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.BASIC,
    )
    following = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="followers",
        blank=True,
    )
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    streamed_today = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        if not self.display_name:
            self.display_name = self.get_full_name() or self.username or self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Preferences(models.Model):
    class Theme(models.TextChoices):
        LIGHT = "light", "Light"
        DARK = "dark", "Dark"

    class Language(models.TextChoices):
        ENGLISH = "en", "English"
        PERSIAN = "fa", "Persian"

    class SystemVoice(models.TextChoices):
        DEFAULT = "default", "Default"
        CALM = "calm", "Calm"
        BRIGHT = "bright", "Bright"

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="preferences",
    )
    theme = models.CharField(
        max_length=10,
        choices=Theme.choices,
        default=Theme.DARK,
    )
    notification_limit = models.PositiveSmallIntegerField(default=20)
    notification_sound_enabled = models.BooleanField(default=True)
    language = models.CharField(
        max_length=5,
        choices=Language.choices,
        default=Language.ENGLISH,
    )
    system_voice = models.CharField(
        max_length=10,
        choices=SystemVoice.choices,
        default=SystemVoice.DEFAULT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} preferences"


class Artist(User):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    stage_name = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    portfolio_links = models.JSONField(default=list, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    listener_count = models.PositiveIntegerField(default=0)
    total_streams = models.PositiveIntegerField(default=0)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        verbose_name = "artist"
        verbose_name_plural = "artists"

    def save(self, *args, **kwargs):
        self.role = self.Role.ARTIST
        if self.stage_name:
            self.display_name = self.stage_name
        if self.is_approved():
            self.is_active = True
        elif self._state.adding:
            self.is_active = False
        super().save(*args, **kwargs)

    def is_approved(self):
        return self.verification_status == self.VerificationStatus.APPROVED

    is_approved.boolean = True
    is_approved.short_description = "approved"
