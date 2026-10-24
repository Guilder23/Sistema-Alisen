from django.test import SimpleTestCase, TestCase

from apps.administrar_pagina.models import TiendaPagina
from apps.almacenes.models import Almacen
from .models import Tienda


class TiendaGoogleMapsUrlTests(SimpleTestCase):
    def test_preserves_google_maps_link(self):
        tienda = Tienda(coordenadas='https://maps.app.goo.gl/example')

        self.assertEqual(tienda.enlace_google_maps, 'https://maps.app.goo.gl/example')

    def test_converts_coordinates_to_google_maps_search(self):
        tienda = Tienda(coordenadas='-17.3935,-66.1570')

        self.assertEqual(
            tienda.enlace_google_maps,
            'https://www.google.com/maps/search/?api=1&query=-17.3935%2C-66.1570',
        )

    def test_returns_empty_link_when_location_is_missing(self):
        tienda = Tienda(coordenadas='')

        self.assertEqual(tienda.enlace_google_maps, '')


class TiendasPublicasTests(TestCase):
    def setUp(self):
        self.almacen = Almacen.objects.create(
            nombre='Almacén de prueba',
            direccion='Av. Principal',
            ciudad='Cochabamba',
            departamento='Cochabamba',
        )

    def crear_tienda(self, nombre, tipo, estado='activo'):
        return Tienda.objects.create(
            nombre=nombre,
            tipo=tipo,
            almacen=self.almacen,
            direccion='Av. Central 123',
            ciudad='Cochabamba',
            departamento='Cochabamba',
            descripcion=f'Descripción de {nombre}',
            coordenadas='https://maps.app.goo.gl/example',
            estado=estado,
        )

    def test_principal_and_active_branches_are_rendered_on_about_page(self):
        tiendas = [
            self.crear_tienda('Casa Matriz', 'principal'),
            self.crear_tienda('Sucursal Norte', 'sucursal'),
            self.crear_tienda('Punto Centro', 'punto_venta'),
            self.crear_tienda('Tienda inactiva', 'sucursal', estado='inactivo'),
        ]
        TiendaPagina.objects.bulk_create([
            TiendaPagina(tienda=tienda, publicado=True)
            for tienda in tiendas
        ])

        response = self.client.get('/nosotros/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Casa Matriz')
        self.assertContains(response, 'Sucursal Norte')
        self.assertContains(response, 'Punto Centro')
        self.assertNotContains(response, 'Tienda inactiva')
        self.assertContains(response, 'modalTiendaPublica')
        self.assertContains(response, 'https://maps.app.goo.gl/example')
