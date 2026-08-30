from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from apps.productos.models import Categoria, Producto
from apps.usuarios.models import PerfilUsuario
from apps.ventas.models import DetalleVenta, Venta


class ReporteVentasProductosTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='admin', password='123456')
        self.user_profile = PerfilUsuario.objects.create(
            usuario=self.user,
            rol='administrador',
            nombre_ubicacion='Sede Central',
        )
        self.categoria = Categoria.objects.create(nombre='Ropa', creado_por=self.user)
        self.producto_a = Producto.objects.create(
            codigo='A-001',
            nombre='Camisa',
            categoria=self.categoria,
            precio_compra=Decimal('50.00'),
            precio_unidad=Decimal('120.00'),
            activo=True,
            publicado=True,
        )
        self.producto_b = Producto.objects.create(
            codigo='B-002',
            nombre='Pantalón',
            categoria=self.categoria,
            precio_compra=Decimal('20.00'),
            precio_unidad=Decimal('80.00'),
            activo=True,
            publicado=True,
        )

        self.venta_1 = Venta.objects.create(
            codigo='VENTA-001',
            ubicacion=self.user_profile,
            cliente='Cliente 1',
            vendedor=self.user,
            estado='completada',
            subtotal=Decimal('300.00'),
            descuento=Decimal('0.00'),
            total=Decimal('300.00'),
        )
        DetalleVenta.objects.create(
            venta=self.venta_1,
            producto=self.producto_a,
            cantidad=2,
            cantidad_cajas=0,
            precio_unitario=Decimal('120.00'),
            subtotal=Decimal('240.00'),
            descuento=Decimal('0.00'),
            modalidad='unidad',
        )

        self.venta_2 = Venta.objects.create(
            codigo='VENTA-002',
            ubicacion=self.user_profile,
            cliente='Cliente 2',
            vendedor=self.user,
            estado='completada',
            subtotal=Decimal('120.00'),
            descuento=Decimal('0.00'),
            total=Decimal('120.00'),
        )
        DetalleVenta.objects.create(
            venta=self.venta_2,
            producto=self.producto_b,
            cantidad=3,
            cantidad_cajas=0,
            precio_unitario=Decimal('80.00'),
            subtotal=Decimal('240.00'),
            descuento=Decimal('40.00'),
            modalidad='unidad',
        )

    def test_totales_de_compra_y_costo_suman_por_cantidad(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('reporte_ventas_productos'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context['total_precio_compra'], Decimal('160.00'))
        self.assertEqual(response.context['total_costo'], Decimal('160.00'))
        self.assertEqual(response.context['total_descuento'], Decimal('40.00'))
        self.assertEqual(response.context['total_ventas_monto'], Decimal('440.00'))
        self.assertEqual(response.context['total_utilidad'], Decimal('280.00'))
