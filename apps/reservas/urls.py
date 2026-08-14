from django.urls import path
from . import views

app_name = 'reservas'

urlpatterns = [
    path('', views.listar_reservas, name='listar_reservas'),
    path('buscar-productos/', views.buscar_productos, name='buscar_productos'),
    path('crear/', views.crear_reserva, name='crear_reserva'),
    path('guardar/', views.guardar_reserva, name='guardar_reserva'),
    path('<int:pk>/ver/', views.ver_reserva, name='ver_reserva'),
    path('<int:pk>/editar/', views.editar_reserva, name='editar_reserva'),
    path('<int:pk>/amortizar/', views.amortizar_reserva, name='amortizar_reserva'),
    path('<int:pk>/anular/', views.anular_reserva, name='anular_reserva'),
    path('<int:pk>/eliminar/', views.eliminar_reserva, name='eliminar_reserva'),
]
