from django.urls import path

from . import views

app_name = 'administrar_pagina'

urlpatterns = [
    path('', views.listar_banners, name='listar_banners'),
    path('crear/', views.crear_banner, name='crear_banner'),
    path('<int:pk>/ver/', views.ver_banner, name='ver_banner'),
    path('<int:pk>/editar/', views.editar_banner, name='editar_banner'),
    path('<int:pk>/eliminar/', views.eliminar_banner, name='eliminar_banner'),
    path('<int:pk>/publicar/', views.cambiar_publicacion, name='cambiar_publicacion'),
    path('tiendas/', views.listar_tiendas_pagina, name='listar_tiendas_pagina'),
    path('tiendas/crear/', views.crear_tienda_pagina, name='crear_tienda_pagina'),
    path('tiendas/<int:pk>/ver/', views.ver_tienda_pagina, name='ver_tienda_pagina'),
    path('tiendas/<int:pk>/editar/', views.editar_tienda_pagina, name='editar_tienda_pagina'),
    path('tiendas/<int:pk>/eliminar/', views.eliminar_tienda_pagina, name='eliminar_tienda_pagina'),
    path('tiendas/<int:pk>/publicar/', views.cambiar_publicacion_tienda, name='cambiar_publicacion_tienda'),
]
