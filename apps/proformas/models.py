from django.db import models
from django.contrib.auth.models import User
from apps.productos.models import Producto


class Proforma(models.Model):
    MONEDAS = (
        ('BOB', 'Bolivianos'),
        ('USD', 'Dólares'),
    )
    TIPOS_DESCUENTO = (
        ('ninguno', 'Sin descuento'),
        ('fijo', 'Monto fijo'),
        ('porcentaje', 'Porcentaje'),
    )

    codigo = models.CharField(max_length=50, unique=True)
    cliente = models.CharField(max_length=200)
    nit = models.CharField(max_length=30, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    razon_social = models.CharField(max_length=200, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    comentario = models.TextField(blank=True, null=True)
    moneda = models.CharField(max_length=10, choices=MONEDAS, default='BOB')
    tipo_cambio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento_tipo = models.CharField(max_length=20, choices=TIPOS_DESCUENTO, default='ninguno')
    descuento_valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='proformas')
    fecha_elaboracion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Proforma'
        verbose_name_plural = 'Proformas'
        ordering = ['-fecha_elaboracion']

    def __str__(self):
        return f'{self.codigo} - {self.cliente}'


class ProformaItem(models.Model):
    MODALIDADES = (
        ('unidad', 'Unidad'),
        ('caja', 'Caja'),
        ('mayor', 'Mayor'),
    )

    proforma = models.ForeignKey(Proforma, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    modalidad = models.CharField(max_length=20, choices=MODALIDADES, default='unidad')
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'Item de Proforma'
        verbose_name_plural = 'Items de Proforma'

    def __str__(self):
        return f'{self.producto.nombre} x {self.cantidad}'
