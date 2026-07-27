from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0014_agregar_campo_publicado_producto'),
    ]

    operations = [
        migrations.AddField(
            model_name='producto',
            name='unidades_por_mayor',
            field=models.IntegerField(
                default=3,
                help_text='Desde cuántas unidades se considera venta por mayor',
            ),
        ),
    ]
