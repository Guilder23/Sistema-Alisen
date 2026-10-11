from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse

from apps.productos.models import Categoria, Producto
from apps.subcategorias.models import Subcategoria
from apps.usuarios.models import PerfilUsuario


class TiendaMayoristaTests(TestCase):
	def setUp(self):
		self.categoria = Categoria.objects.create(nombre='Accesorios mayoristas', activo=True)
		self.categoria_otra = Categoria.objects.create(nombre='Relojes', activo=True)
		self.subcategoria = Subcategoria.objects.create(
			categoria=self.categoria,
			nombre='Carteras',
			activo=True,
		)
		self.subcategoria_otra = Subcategoria.objects.create(
			categoria=self.categoria_otra,
			nombre='Relógos',
			activo=True,
		)
		Producto.objects.create(
			codigo='MAY-001',
			nombre='Producto mayorista',
			categoria=self.categoria,
			subcategoria=self.subcategoria,
			precio_unidad=120,
			precio_mayor=90,
			unidades_por_mayor=6,
			activo=True,
			publicado=True,
		)
		Producto.objects.create(
			codigo='MAY-002',
			nombre='Sin precio mayorista',
			categoria=self.categoria,
			subcategoria=self.subcategoria,
			precio_unidad=120,
			precio_mayor=0,
			activo=True,
			publicado=True,
		)

	def test_catalogo_mayorista_filtra_por_subcategoria_y_precio(self):
		response = self.client.get(
			'/tienda-mayorista/',
			{'categoria': self.categoria.id, 'subcategoria': self.subcategoria.id},
		)

		self.assertEqual(response.status_code, 200)
		self.assertContains(response, 'Producto mayorista')
		self.assertNotContains(response, 'Sin precio mayorista')
		self.assertContains(response, 'Mínimo:')
		self.assertContains(response, '<strong>6</strong>')
		self.assertEqual(response.context['productos'].count(), 1)
		self.assertEqual(response.context['productos'].first().precio_mayor, 90)

	def test_subcategorias_se_limitan_a_la_categoria_seleccionada_en_ambas_tiendas(self):
		response_tienda = self.client.get('/tienda/', {'categoria': self.categoria.id})
		response_mayorista = self.client.get('/tienda-mayorista/', {'categoria': self.categoria.id})

		self.assertEqual(response_tienda.status_code, 200)
		self.assertEqual(response_mayorista.status_code, 200)
		self.assertEqual(list(response_tienda.context['subcategorias'].values_list('id', flat=True)), [self.subcategoria.id])
		self.assertEqual(list(response_mayorista.context['subcategorias'].values_list('id', flat=True)), [self.subcategoria.id])


class UsuarioEmailOpcionalTests(TestCase):
	def setUp(self):
		self.admin = User.objects.create_user(username='admin', password='password123')
		PerfilUsuario.objects.create(usuario=self.admin, rol='administrador')
		self.client.force_login(self.admin)

	def test_crear_usuario_sin_correo(self):
		response = self.client.post(reverse('crear_usuario'), {
			'username': 'usuario_nuevo',
			'password': 'password123',
			'password2': 'password123',
			'rol': 'administrador',
			'is_active': 'on',
		})

		self.assertRedirects(response, reverse('listar_usuarios'))
		self.assertEqual(User.objects.get(username='usuario_nuevo').email, '')

	def test_editar_usuario_con_correo_vacio(self):
		usuario = User.objects.create_user(
			username='usuario_existente',
			password='password123',
			email='anterior@correo.com',
		)
		PerfilUsuario.objects.create(usuario=usuario, rol='administrador')

		response = self.client.post(reverse('editar_usuario', args=[usuario.id]), {
			'email': '',
			'rol': 'administrador',
			'is_active': 'on',
		})

		self.assertRedirects(response, reverse('listar_usuarios'))
		usuario.refresh_from_db()
		self.assertEqual(usuario.email, '')

# Create your tests here.
