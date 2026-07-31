from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from apps.usuarios.models import PerfilUsuario

from .models import Categoria, Producto


class CategoriaProductoOfertaTests(TestCase):
    def test_categoria_puede_guardar_foto(self):
        foto = SimpleUploadedFile(
            'categoria.jpg',
            b'fake-image-content',
            content_type='image/jpeg'
        )

        categoria = Categoria.objects.create(nombre='Accesorios', descripcion='Categoría de prueba', foto=foto)

        self.assertTrue(categoria.foto)
        self.assertIn('categoria', categoria.foto.name.lower())

    def test_productos_en_oferta_se_pueden_filtrar(self):
        Producto.objects.create(codigo='P-001', nombre='Producto oferta', precio_unidad=10, activo=True, publicado=True, en_oferta=True)
        Producto.objects.create(codigo='P-002', nombre='Producto normal', precio_unidad=20, activo=True, publicado=True, en_oferta=False)

        productos_oferta = Producto.objects.filter(activo=True, publicado=True, en_oferta=True)

        self.assertEqual(productos_oferta.count(), 1)
        self.assertEqual(productos_oferta.first().codigo, 'P-001')

    def test_crear_categoria_desde_vista_con_usuario_almacen(self):
        user = User.objects.create_user(username='almacen', password='12345678')
        PerfilUsuario.objects.create(usuario=user, rol='almacen', nombre_ubicacion='Almacén principal')

        self.client.force_login(user)
        response = self.client.post(
            reverse('crear_categoria'),
            {
                'nombre': 'Nueva categoría',
                'descripcion': 'Descripción de prueba',
                'activo': 'on',
            },
            follow=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Categoria.objects.filter(nombre='Nueva categoría').exists())
