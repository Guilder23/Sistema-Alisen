from django.db import migrations, models
import django.db.models.deletion


def migrar_fotos_existentes(apps, schema_editor):
    Producto = apps.get_model('productos', 'Producto')
    ProductoImagen = apps.get_model('productos', 'ProductoImagen')
    for producto in Producto.objects.exclude(foto='').exclude(foto__isnull=True):
        if not ProductoImagen.objects.filter(producto=producto).exists():
            ProductoImagen.objects.create(
                producto=producto,
                imagen=producto.foto,
                es_principal=True,
                orden=0,
            )


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0015_producto_unidades_por_mayor'),
    ]

    operations = [
        migrations.AddField(
            model_name='producto',
            name='video_youtube',
            field=models.URLField(
                blank=True,
                help_text='URL del video de YouTube del producto',
                max_length=500,
                null=True,
                verbose_name='Video de YouTube',
            ),
        ),
        migrations.CreateModel(
            name='ProductoImagen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('imagen', models.ImageField(upload_to='productos/galeria/', verbose_name='Imagen')),
                ('es_principal', models.BooleanField(default=False, verbose_name='Imagen principal')),
                ('orden', models.PositiveIntegerField(default=0, verbose_name='Orden')),
                ('producto', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='imagenes',
                    to='productos.producto',
                    verbose_name='Producto',
                )),
            ],
            options={
                'verbose_name': 'Imagen de producto',
                'verbose_name_plural': 'Imágenes de producto',
                'ordering': ['-es_principal', 'orden', 'id'],
            },
        ),
        migrations.RunPython(migrar_fotos_existentes, migrations.RunPython.noop),
    ]
