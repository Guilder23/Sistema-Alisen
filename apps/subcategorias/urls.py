from django.urls import path
from . import views

app_name = 'subcategorias'

urlpatterns = [
    path('', views.listar_subcategorias, name='listar'),
    path('json/', views.listar_subcategorias_json, name='listar_json'),
    path('crear/', views.crear_subcategoria, name='crear'),
    path('<int:id>/obtener/', views.obtener_subcategoria, name='obtener'),
    path('<int:id>/editar/', views.editar_subcategoria, name='editar'),
    path('<int:id>/eliminar/', views.eliminar_subcategoria, name='eliminar'),
]
