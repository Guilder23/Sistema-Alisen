from django.contrib import admin
from .models import ReservaProducto, ReservaItem, PagoReserva


@admin.register(ReservaProducto)
class ReservaProductoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'cliente', 'tipo_pago', 'total', 'estado')
    list_filter = ('estado', 'tipo_pago', 'fecha_reserva')
    search_fields = ('codigo', 'cliente', 'nit', 'razon_social')


@admin.register(ReservaItem)
class ReservaItemAdmin(admin.ModelAdmin):
    list_display = ('reserva', 'producto', 'cantidad', 'modalidad', 'subtotal')
    search_fields = ('reserva__codigo', 'producto__nombre')


@admin.register(PagoReserva)
class PagoReservaAdmin(admin.ModelAdmin):
    list_display = ('reserva', 'monto', 'metodo_pago', 'fecha_pago', 'registrado_por')
    list_filter = ('metodo_pago', 'fecha_pago')
    search_fields = ('reserva__codigo', 'observaciones')
