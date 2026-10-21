from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from apps.almacenes.models import Almacen
from apps.tiendas.models import Tienda
from .models import TiendaPagina


class TiendaPaginaTests(TestCase):
    def setUp(self):
        self.almacen = Almacen.objects.create(
            nombre='Almacén de pruebas',
            direccion='Av. Central',
            ciudad='Cochabamba',
            departamento='Cochabamba',
        )

    def crear_tienda(self, nombre, tipo, descripcion='Descripción de tienda'):
        return Tienda.objects.create(
            nombre=nombre,
            tipo=tipo,
            almacen=self.almacen,
            direccion='Calle 1',
            ciudad='Cochabamba',
            departamento='Cochabamba',
            coordenadas='-17.3935,-66.1570',
            descripcion=descripcion,
            estado='activo',
        )

    def test_about_page_uses_published_store_configurations_and_existing_store_data(self):
        principal = self.crear_tienda('Casa Matriz', 'principal')
        sucursal = self.crear_tienda('Sucursal Centro', 'sucursal')
        borrador = self.crear_tienda('Sucursal Borrador', 'sucursal')
        TiendaPagina.objects.create(tienda=principal, publicado=True)
        TiendaPagina.objects.create(tienda=sucursal, publicado=True)
        TiendaPagina.objects.create(tienda=borrador, publicado=False)

        response = self.client.get(reverse('nosotros'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Casa Matriz')
        self.assertContains(response, 'Sucursal Centro')
        self.assertContains(response, 'Descripción de tienda')
        self.assertContains(response, '/maps/search/?api=1&amp;query=-17.3935%2C-66.1570')
        self.assertNotContains(response, 'Sucursal Borrador')

    def test_about_page_shows_empty_state_when_no_secondary_store_is_published(self):
        principal = self.crear_tienda('Casa Matriz', 'principal')
        TiendaPagina.objects.create(tienda=principal, publicado=True)

        response = self.client.get(reverse('nosotros'))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Pronto encontrarás aquí nuestras sucursales y puntos de venta.')
        self.assertNotContains(response, 'class="about-store-card')

    def test_admin_form_lists_existing_stores_and_creates_page_configuration(self):
        tienda = self.crear_tienda('Sucursal Norte', 'sucursal')
        admin = User.objects.create_user(username='admin', password='secret', is_staff=True)
        self.client.force_login(admin)

        response = self.client.get(reverse('administrar_pagina:crear_tienda_pagina'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Sucursal Norte')

        response = self.client.post(
            reverse('administrar_pagina:crear_tienda_pagina'),
            {
                'tienda': tienda.pk,
                'descripcion': 'Texto para la página',
                'orden': 2,
                'publicado': 'on',
            },
        )

        self.assertRedirects(response, reverse('administrar_pagina:listar_tiendas_pagina'))
        config = TiendaPagina.objects.get(tienda=tienda)
        self.assertTrue(config.publicado)
        self.assertEqual(config.descripcion_publica, 'Texto para la página')
        self.assertEqual(config.enlace_google_maps, tienda.enlace_google_maps)

    def test_banner_create_and_store_detail_are_modal_fragments(self):
        tienda = self.crear_tienda('Sucursal Modal', 'sucursal')
        config = TiendaPagina.objects.create(tienda=tienda)
        admin = User.objects.create_user(username='modal-admin', password='secret', is_staff=True)
        self.client.force_login(admin)

        banner_response = self.client.get(
            reverse('administrar_pagina:crear_banner'),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        store_response = self.client.get(
            reverse('administrar_pagina:ver_tienda_pagina', args=[config.pk]),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(banner_response.status_code, 200)
        self.assertContains(banner_response, 'modal-header')
        self.assertNotContains(banner_response, '<html')
        self.assertEqual(store_response.status_code, 200)
        self.assertContains(store_response, 'modal-header')
        self.assertNotContains(store_response, '<html')
