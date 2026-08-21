from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0008_venta_tipo_venta'),
    ]

    operations = [
        migrations.AddField(
            model_name='detalleventa',
            name='descuento',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='detalleventa',
            name='descuento_tipo',
            field=models.CharField(choices=[('ninguno', 'Sin descuento'), ('fijo', 'Monto fijo'), ('porcentaje', 'Porcentaje')], default='ninguno', max_length=20),
        ),
        migrations.AddField(
            model_name='detalleventa',
            name='descuento_valor',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]