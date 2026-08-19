from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('productos', '0001_initial'),
    ]
    operations = [
        migrations.CreateModel(
            name='Subcategoria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, verbose_name='Nombre')),
                ('descripcion', models.TextField(blank=True, null=True, verbose_name='Descripción')),
                ('activo', models.BooleanField(default=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('categoria', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subcategorias', to='productos.categoria', verbose_name='Categoría')),
                ('creado_por', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='subcategorias_creadas', to='auth.user')),
            ],
            options={'ordering': ['categoria__nombre', 'nombre'], 'verbose_name': 'Subcategoría', 'verbose_name_plural': 'Subcategorías'},
        ),
        migrations.AddConstraint(
            model_name='subcategoria',
            constraint=models.UniqueConstraint(fields=('categoria', 'nombre'), name='unique_subcategoria_categoria_nombre'),
        ),
    ]
