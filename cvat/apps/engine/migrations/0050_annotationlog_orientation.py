# Generated by Django 3.1.13 on 2022-11-22 01:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('engine', '0049_annotationlog'),
    ]

    operations = [
        migrations.AddField(
            model_name='annotationlog',
            name='orientation',
            field=models.CharField(blank=True, max_length=5, null=True),
        ),
    ]