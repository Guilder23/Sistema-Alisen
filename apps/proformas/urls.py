from django.urls import path
from . import views

app_name = 'proformas'

urlpatterns = [
    path('', views.listar_proformas, name='listar_proformas'),
    path('crear/', views.modal_proforma, name='modal_proforma'),
    path('ver/<int:id>/', views.ver_proforma, name='ver_proforma'),
    path('editar/<int:id>/', views.editar_proforma, name='editar_proforma'),
    path('eliminar/<int:id>/', views.eliminar_proforma, name='eliminar_proforma'),
    path('pdf/<int:id>/', views.generar_pdf_proforma, name='pdf_proforma'),

    # API endpoints
    path('api/buscar-productos/', views.buscar_productos, name='buscar_productos'),
    path('api/proforma/<int:id>/', views.obtener_proforma, name='obtener_proforma'),
    path('api/guardar/', views.guardar_proforma, name='guardar_proforma'),
    path('api/actualizar/<int:id>/', views.actualizar_proforma, name='actualizar_proforma'),
]
