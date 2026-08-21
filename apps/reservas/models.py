from decimal import Decimal

from django.db import models
from django.contrib.auth.models import User
from apps.productos.models import Producto
from apps.usuarios.models import PerfilUsuario


class ReservaProducto(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('parcial', 'Parcial'),
        ('completada', 'Completada'),
        ('anulada', 'Anulada'),
    )
    TIPOS_PAGO = (
        ('contado', 'Contado'),
        ('credito', 'Crédito'),
    )
    TIPOS_DESCUENTO = (
        ('ninguno', 'Sin descuento'),
        ('fijo', 'Monto fijo'),
        ('porcentaje', 'Porcentaje'),
    )
    METODOS_PAGO = (
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('qr', 'QR'),
    )

    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código')
    ubicacion = models.ForeignKey(PerfilUsuario, on_delete=models.CASCADE, related_name='reservas', verbose_name='Ubicación')
    cliente = models.CharField(max_length=200, verbose_name='Cliente')
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    nit = models.CharField(max_length=30, blank=True, null=True, verbose_name='NIT')
    razon_social = models.CharField(max_length=200, blank=True, null=True, verbose_name='Razón social')
    direccion = models.TextField(blank=True, null=True, verbose_name='Dirección')
    comentario = models.TextField(blank=True, null=True, verbose_name='Comentario')
    tipo_pago = models.CharField(max_length=20, choices=TIPOS_PAGO, default='contado')
    metodo_pago = models.CharField(max_length=20, choices=METODOS_PAGO, default='efectivo')
    moneda = models.CharField(max_length=10, choices=[('BOB', 'Bolivianos'), ('USD', 'Dólares')], default='BOB')
    tipo_cambio = models.DecimalField(max_digits=10, decimal_places=4, default=1.0)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento_tipo = models.CharField(max_length=20, choices=TIPOS_DESCUENTO, default='ninguno')
    descuento_valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    inventario_tipo = models.CharField(max_length=20, choices=[('tienda', 'Tienda'), ('deposito', 'Depósito')], default='tienda', verbose_name='Inventario usado')
    fecha_reserva = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de reserva')
    fecha_entrega = models.DateTimeField(blank=True, null=True, verbose_name='Fecha de entrega')
    observaciones = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    registrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservas_registradas')

    class Meta:
        ordering = ['-fecha_reserva']
        verbose_name = 'Reserva de producto'
        verbose_name_plural = 'Reservas de productos'

    def __str__(self):
        return f'{self.codigo} - {self.cliente}'

    @property
    def total_amortizado(self):
        return sum((p.monto for p in self.pagos.all()), Decimal('0.00'))

    @property
    def total_pagado(self):
        return self.total_amortizado

    @property
    def saldo_pendiente(self):
        return max(self.total - self.total_amortizado, Decimal('0.00'))

    @property
    def estado_pago(self):
        if self.estado == 'anulada':
            return 'anulada'
        if self.total > 0 and self.total_pagado >= self.total:
            return 'completada'
        if self.total_pagado > 0:
            return 'parcial'
        return 'pendiente'


class ReservaItem(models.Model):
    MODALIDADES = (
        ('unidad', 'Unidad'),
        ('caja', 'Caja'),
        ('mayor', 'Mayor'),
    )

    reserva = models.ForeignKey(ReservaProducto, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField(default=1)
    modalidad = models.CharField(max_length=20, choices=MODALIDADES, default='unidad')
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    descuento = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descuento_tipo = models.CharField(max_length=20, choices=ReservaProducto.TIPOS_DESCUENTO, default='ninguno')
    descuento_valor = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Item de reserva'
        verbose_name_plural = 'Items de reserva'

    def __str__(self):
        return f'{self.producto.nombre} x {self.cantidad}'

    @property
    def subtotal_neto(self):
        return max(self.subtotal - self.descuento, 0)


class PagoReserva(models.Model):
    reserva = models.ForeignKey(ReservaProducto, on_delete=models.CASCADE, related_name='pagos', verbose_name='Reserva')
    monto = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Monto pagado')
    moneda = models.CharField(max_length=10, choices=[('BOB', 'Bolivianos'), ('USD', 'Dólares')], default='BOB')
    metodo_pago = models.CharField(max_length=20, choices=[('efectivo', 'Efectivo'), ('transferencia', 'Transferencia'), ('qr', 'QR')], default='efectivo')
    fecha_pago = models.DateTimeField(auto_now_add=True, verbose_name='Fecha del pago')
    comprobante = models.ImageField(upload_to='comprobantes/reservas/', blank=True, null=True, verbose_name='Comprobante')
    observaciones = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    registrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='pagos_reservas_registrados')

    class Meta:
        ordering = ['-fecha_pago']
        verbose_name = 'Pago de reserva'
        verbose_name_plural = 'Pagos de reservas'

    def __str__(self):
        return f'{self.reserva.codigo} - {self.monto}'
