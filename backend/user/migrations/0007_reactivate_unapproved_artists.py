from django.db import migrations


def reactivate_unapproved_artists(apps, schema_editor):
    Artist = apps.get_model("user", "Artist")
    User = apps.get_model("user", "User")
    artist_ids = Artist.objects.exclude(
        verification_status="approved"
    ).values_list("pk", flat=True)
    User.objects.filter(pk__in=artist_ids, is_active=False).update(is_active=True)


class Migration(migrations.Migration):
    dependencies = [
        ("user", "0006_delete_subscriptionfee"),
    ]

    operations = [
        migrations.RunPython(
            reactivate_unapproved_artists,
            migrations.RunPython.noop,
        ),
    ]
