from django.db import models
from apps.tiendas.models import Tienda


class Banner(models.Model):
    titulo = models.CharField(max_length=120, verbose_name='Nombre del banner')
    imagen = models.ImageField(upload_to='banners/', verbose_name='Imagen')
    texto_alternativo = models.CharField(max_length=200, verbose_name='Texto alternativo')
    enlace = models.URLField(blank=True, verbose_name='Enlace (opcional)')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden de visualización')
    publicado = models.BooleanField(default=False, verbose_name='Publicado')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['orden', 'id']
        verbose_name = 'Banner'
        verbose_name_plural = 'Banners'

    def __str__(self):
        return self.titulo


class TiendaPagina(models.Model):
    tienda = models.OneToOneField(
        Tienda,
        on_delete=models.CASCADE,
        related_name='configuracion_pagina',
        verbose_name='Tienda',
    )
    imagen = models.ImageField(upload_to='tiendas/pagina/', blank=True, verbose_name='Foto para la página')
    descripcion = models.TextField(blank=True, verbose_name='Descripción para la página')
    orden = models.PositiveIntegerField(default=0, verbose_name='Orden de visualización')
    publicado = models.BooleanField(default=False, verbose_name='Publicada en la página')
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['orden', 'tienda__nombre']
        verbose_name = 'Tienda de página'
        verbose_name_plural = 'Tiendas de página'

    def __str__(self):
        return f'{self.tienda.nombre} - Página'

    @property
    def foto_publica(self):
        if self.imagen:
            return self.imagen
        return self.tienda.foto

    @property
    def descripcion_publica(self):
        return self.descripcion.strip() or self.tienda.descripcion or ''

    @property
    def tipo_tienda(self):
        return self.tienda.get_tipo_display()

    @property
    def direccion_publica(self):
        return f'{self.tienda.direccion}, {self.tienda.ciudad}, {self.tienda.departamento}'

    @property
    def enlace_google_maps(self):
        return self.tienda.enlace_google_maps
