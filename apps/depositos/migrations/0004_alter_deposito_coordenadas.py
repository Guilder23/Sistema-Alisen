from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('depositos', '0003_remove_deposito_extra_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='deposito',
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
