from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('productos', '0018_producto_precio_unidad_oferta'), ('subcategorias', '0001_initial')]
    operations = [migrations.AddField(model_name='producto', name='subcategoria', field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='productos', to='subcategorias.subcategoria'))]