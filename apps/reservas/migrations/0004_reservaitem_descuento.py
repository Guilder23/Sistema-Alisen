from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0003_reservaproducto_inventario_tipo'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservaitem',
            name='descuento',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='reservaitem',
            name='descuento_tipo',
            field=models.CharField(choices=[('ninguno', 'Sin descuento'), ('fijo', 'Monto fijo'), ('porcentaje', 'Porcentaje')], default='ninguno', max_length=20),
        ),
        migrations.AddField(
            model_name='reservaitem',
            name='descuento_valor',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]