from django.urls import path
from . import views

urlpatterns = [
    # Reportes
    path('', views.index_reportes, name='index_reportes'),
    path('inventario/', views.reporte_inventario, name='reporte_inventario'),
    path('ventas/', views.reporte_ventas, name='reporte_ventas'),
    path('ventas/comision/', views.reporte_ventas_comision_pdf, name='reporte_ventas_comision'),
    path('traspasos/', views.reporte_traspasos, name='reporte_traspasos'),
    path('contenedores/', views.reporte_contenedores, name='reporte_contenedores'),
    path('ventas-productos/', views.reporte_ventas_productos, name='reporte_ventas_productos'),
]
