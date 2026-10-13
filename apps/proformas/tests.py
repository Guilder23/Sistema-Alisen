from decimal import Decimal

from django.test import SimpleTestCase

from apps.productos.models import Producto

from .views import validar_cantidad_modalidad_proforma


class ProformaModalidadTests(SimpleTestCase):
    def test_modalidad_mayor_no_depende_de_unidades_por_caja(self):
        producto = Producto(
            codigo='MAYOR-TEST',
            nombre='Producto mayorista',
            precio_mayor=Decimal('45.00'),
            unidades_por_caja=1,
            unidades_por_mayor=3,
        )

        validar_cantidad_modalidad_proforma(producto, 'mayor', 3)

        with self.assertRaises(ValueError):
            validar_cantidad_modalidad_proforma(producto, 'mayor', 2)

        producto.precio_mayor = Decimal('0.00')
        with self.assertRaises(ValueError):
            validar_cantidad_modalidad_proforma(producto, 'mayor', 3)