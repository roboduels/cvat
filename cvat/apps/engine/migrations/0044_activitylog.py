# Generated by Django 3.1.13 on 2021-12-02 11:38

import cvat.apps.engine.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('engine', '0043_auto_20211024_0949'),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivityLog',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('type', cvat.apps.engine.models.SafeCharField(max_length=256)),
                ('options', models.JSONField()),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]