# Generated by Django 3.1.13 on 2022-11-21 19:33

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('engine', '0048_auto_20221119_2153'),
    ]

    operations = [
        migrations.CreateModel(
            name='AnnotationLog',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('order_id', models.CharField(blank=True, max_length=64, null=True)),
                ('certificate_id', models.CharField(blank=True, max_length=64, null=True)),
                ('action', models.CharField(blank=True, max_length=16, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('label', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='engine.label')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='annotation_log_owners', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]