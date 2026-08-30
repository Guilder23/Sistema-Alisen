import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sistemaInventario.settings')
django.setup()

from apps.ventas.models import (
    AmortizacionCredito,
    DetalleVenta,
    SolicitudAnulacionVenta,
    Venta,
)


def main():
    enabled = os.getenv('DELETE_SALES_ON_DEPLOY', 'false').strip().lower() == 'true'

    if not enabled:
        print('DELETE_SALES_ON_DEPLOY=false; no se eliminan las ventas al desplegar.')
        return

    print('ELIMINANDO ventas al desplegar...')
    print(f'Antes -> Ventas: {Venta.objects.count()} | Detalles: {DetalleVenta.objects.count()} | Amortizaciones: {AmortizacionCredito.objects.count()} | Solicitudes: {SolicitudAnulacionVenta.objects.count()}')

    DetalleVenta.objects.all().delete()
    AmortizacionCredito.objects.all().delete()
    SolicitudAnulacionVenta.objects.all().delete()
    Venta.objects.all().delete()

    print(f'Después -> Ventas: {Venta.objects.count()} | Detalles: {DetalleVenta.objects.count()} | Amortizaciones: {AmortizacionCredito.objects.count()} | Solicitudes: {SolicitudAnulacionVenta.objects.count()}')
    print('✅ Ventas eliminadas correctamente en deploy.')


if __name__ == '__main__':
    main()
