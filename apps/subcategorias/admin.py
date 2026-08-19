from django.contrib import admin
from .models import Subcategoria


@admin.register(Subcategoria)
class SubcategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'categoria', 'activo', 'creado_por', 'fecha_creacion']
    list_filter = ['categoria', 'activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion', 'categoria__nombre']
