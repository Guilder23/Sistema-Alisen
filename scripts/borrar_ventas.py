import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sistemaInventario.settings')
django.setup()

from apps.ventas.models import Venta, DetalleVenta, AmortizacionCredito, SolicitudAnulacionVenta

print('Antes de borrar:')
print(f'Ventas: {Venta.objects.count()}')
print(f'Detalles: {DetalleVenta.objects.count()}')
print(f'Amortizaciones: {AmortizacionCredito.objects.count()}')
print(f'Solicitudes de anulación: {SolicitudAnulacionVenta.objects.count()}')

respuesta = input('\n¿Seguro que deseas eliminar todas las ventas? Escribe: SI\n> ').strip()

if respuesta != 'SI':
    print('Operación cancelada.')
    raise SystemExit

DetalleVenta.objects.all().delete()
AmortizacionCredito.objects.all().delete()
SolicitudAnulacionVenta.objects.all().delete()
Venta.objects.all().delete()

print('\nDespués de borrar:')
print(f'Ventas: {Venta.objects.count()}')
print(f'Detalles: {DetalleVenta.objects.count()}')
print(f'Amortizaciones: {AmortizacionCredito.objects.count()}')
print(f'Solicitudes de anulación: {SolicitudAnulacionVenta.objects.count()}')
print('\n✅ Ventas eliminadas correctamente.')
