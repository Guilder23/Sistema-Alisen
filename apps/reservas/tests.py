from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from apps.almacenes.models import Almacen
from apps.inventario.models import Inventario
from apps.productos.models import Producto
from apps.tiendas.models import Tienda
from apps.usuarios.models import PerfilUsuario
from apps.ventas.models import DetalleVenta, Venta
from .models import PagoReserva, ReservaProducto


User = get_user_model()


class ReservaProductoViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tienda1', password='testpass123')
        self.almacen = Almacen.objects.create(
            nombre='Almacén Test',
            direccion='Calle Falsa 123',
            ciudad='La Paz',
            departamento='La Paz',
            telefono='123456',
            email='almacen@test.com',
        )
        self.tienda = Tienda.objects.create(
            nombre='Tienda Central',
            descripcion='Tienda de prueba',
            tipo='principal',
            almacen=self.almacen,
            direccion='Av. Prueba 1',
            ciudad='La Paz',
            departamento='La Paz',
            telefono='76543210',
            estado='activo',
        )
        self.perfil = PerfilUsuario.objects.create(
            usuario=self.user,
            rol='tienda',
            nombre_ubicacion='Tienda Central',
            tienda=self.tienda,
        )
        self.reserva = ReservaProducto.objects.create(
            codigo='R-00001',
            ubicacion=self.perfil,
            cliente='Cliente Demo',
            total=Decimal('150.00'),
            subtotal=Decimal('150.00'),
            registrado_por=self.user,
        )
        PagoReserva.objects.create(
            reserva=self.reserva,
            monto=Decimal('60.00'),
            registrado_por=self.user,
        )

    def test_listar_reservas_renders_without_assigning_read_only_property(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('reservas:listar_reservas'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Cliente Demo')
        self.assertEqual(self.reserva.saldo_pendiente, Decimal('90.00'))

    def test_guardar_reserva_descuenta_stock_y_anular_retorna_stock(self):
        producto = Producto.objects.create(
            codigo='P-001',
            nombre='Camisa Test',
            precio_unidad=Decimal('50.00'),
            precio_caja=Decimal('500.00'),
            precio_mayor=Decimal('45.00'),
            activo=True,
        )
        Inventario.objects.create(producto=producto, ubicacion=self.perfil, cantidad=10)

        self.client.force_login(self.user)
        payload = {
            'cliente': 'Juan Reserva',
            'telefono': '777',
            'tipo_pago': 'contado',
            'metodo_pago': 'efectivo',
            'moneda': 'BOB',
            'tipo_cambio': '1',
            'descuento_tipo': 'ninguno',
            'descuento_valor': '0',
            'ubicacion_tipo': 'tienda',
            'items': [{
                'producto_id': producto.id,
                'cantidad': 3,
                'modalidad': 'unidad',
                'precio_unitario': '50.00',
            }],
        }

        response = self.client.post(
            reverse('reservas:guardar_reserva'),
            data=payload,
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        self.assertEqual(Inventario.objects.get(producto=producto, ubicacion=self.perfil).cantidad, 7)

        reserva = ReservaProducto.objects.get(cliente='Juan Reserva')
        self.client.post(reverse('reservas:anular_reserva', args=[reserva.pk]), data={'motivo': 'Prueba'})
        self.assertEqual(Inventario.objects.get(producto=producto, ubicacion=self.perfil).cantidad, 10)

    def test_pago_completo_de_reserva_crea_venta_normal(self):
        producto = Producto.objects.create(
            codigo='P-002',
            nombre='Pantalón Test',
            precio_unidad=Decimal('80.00'),
            precio_caja=Decimal('800.00'),
            precio_mayor=Decimal('75.00'),
            activo=True,
        )
        Inventario.objects.create(producto=producto, ubicacion=self.perfil, cantidad=10)

        reserva = ReservaProducto.objects.create(
            codigo='R-00010',
            ubicacion=self.perfil,
            cliente='Cliente de venta',
            total=Decimal('160.00'),
            subtotal=Decimal('160.00'),
            registrado_por=self.user,
            inventario_tipo='tienda',
        )
        ReservaProducto.objects.filter(pk=reserva.pk).update(total=Decimal('160.00'), subtotal=Decimal('160.00'))
        ReservaItem = reserva.items.model
        ReservaItem.objects.create(
            reserva=reserva,
            producto=producto,
            cantidad=2,
            modalidad='unidad',
            precio_unitario=Decimal('80.00'),
            subtotal=Decimal('160.00'),
        )

        self.client.force_login(self.user)
        response = self.client.post(
            reverse('reservas:amortizar_reserva', args=[reserva.pk]),
            data={'monto': '160.00', 'metodo_pago': 'efectivo', 'observaciones': 'Pago completo'}
        )

        self.assertEqual(response.status_code, 302)
        reserva.refresh_from_db()
        self.assertEqual(reserva.estado, 'completada')
        self.assertTrue(Venta.objects.filter(cliente='Cliente de venta', total=Decimal('160.00')).exists())
        self.assertTrue(DetalleVenta.objects.filter(venta__cliente='Cliente de venta').exists())
