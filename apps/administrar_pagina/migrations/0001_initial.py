from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Banner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=120, verbose_name='Nombre del banner')),
                ('imagen', models.ImageField(upload_to='banners/', verbose_name='Imagen')),
                ('texto_alternativo', models.CharField(max_length=200, verbose_name='Texto alternativo')),
                ('enlace', models.URLField(blank=True, verbose_name='Enlace (opcional)')),
                ('orden', models.PositiveIntegerField(default=0, verbose_name='Orden de visualización')),
                ('publicado', models.BooleanField(default=False, verbose_name='Publicado')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Banner',
                'verbose_name_plural': 'Banners',
                'ordering': ['orden', 'id'],
            },
        ),
    ]
