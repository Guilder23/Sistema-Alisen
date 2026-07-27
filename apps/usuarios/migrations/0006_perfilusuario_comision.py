from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0005_alter_perfilusuario_rol'),
    ]

    operations = [
        migrations.AddField(
            model_name='perfilusuario',
            name='comision',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Porcentaje de comisión sobre ventas (%)',
                max_digits=5,
            ),
        ),
    ]
