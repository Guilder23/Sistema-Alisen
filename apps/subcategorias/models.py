from django.conf import settings
from django.db import models


class Subcategoria(models.Model):
    categoria = models.ForeignKey(
        'productos.Categoria',
        on_delete=models.CASCADE,
        related_name='subcategorias',
        verbose_name='Categoría',
    )
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    activo = models.BooleanField(default=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subcategorias_creadas',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['categoria__nombre', 'nombre']
        constraints = [
            models.UniqueConstraint(fields=['categoria', 'nombre'], name='unique_subcategoria_categoria_nombre')
        ]
        verbose_name = 'Subcategoría'
        verbose_name_plural = 'Subcategorías'

    def __str__(self):
        return f'{self.categoria.nombre} / {self.nombre}'
