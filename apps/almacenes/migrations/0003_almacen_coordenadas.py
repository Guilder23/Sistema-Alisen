from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('almacenes', '0002_remove_almacen_capacidad_m2_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='almacen',
            name='coordenadas',
            field=models.CharField(
                blank=True,
                help_text='Pega aquí el enlace de Google Maps de la ubicación',
                max_length=500,
                null=True,
                verbose_name='Link Google Maps',
            ),
        ),
    ]
