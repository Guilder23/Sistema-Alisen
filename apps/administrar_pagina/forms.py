from django import forms
from django.db.models import Q

from apps.tiendas.models import Tienda
from .models import Banner
from .models import TiendaPagina


class BannerForm(forms.ModelForm):
    imagen = forms.ImageField(
        required=False,
        label='Imagen',
        help_text='Usa una imagen panorámica para que se adapte al carrusel de inicio.',
    )

    class Meta:
        model = Banner
        fields = ['titulo', 'imagen', 'texto_alternativo', 'enlace', 'orden', 'publicado']
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'texto_alternativo': forms.TextInput(attrs={'class': 'form-control'}),
            'enlace': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://'}),
            'orden': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
            'publicado': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'orden': 'Orden de visualización',
            'publicado': 'Publicar en la página de inicio',
        }

    def clean_imagen(self):
        imagen = self.cleaned_data.get('imagen')
        if not imagen and not self.instance.pk:
            raise forms.ValidationError('Selecciona una imagen para el banner.')
        return imagen


class TiendaPaginaForm(forms.ModelForm):
    class Meta:
        model = TiendaPagina
        fields = ['tienda', 'imagen', 'descripcion', 'orden', 'publicado']
        widgets = {
            'tienda': forms.Select(attrs={'class': 'form-control', 'id': 'id_tienda'}),
            'imagen': forms.ClearableFileInput(attrs={'class': 'form-control-file', 'accept': 'image/*'}),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Opcional. Si queda vacío, se usará la descripción de Gestión de tiendas.',
            }),
            'orden': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
            'publicado': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'tienda': 'Elegir tienda existente',
            'imagen': 'Foto para la página',
            'descripcion': 'Descripción para la página',
            'orden': 'Orden de visualización',
            'publicado': 'Publicar en la página Nosotros',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tiendas = Tienda.objects.select_related('almacen').order_by('nombre')
        tiendas_sin_configurar = tiendas.filter(configuracion_pagina__isnull=True)
        if self.instance.pk:
            tiendas_sin_configurar = tiendas.filter(
                Q(configuracion_pagina__isnull=True) | Q(pk=self.instance.tienda_id)
            )
        self.fields['tienda'].queryset = tiendas_sin_configurar
        self.fields['imagen'].required = False

    def clean(self):
        cleaned_data = super().clean()
        tienda = cleaned_data.get('tienda')
        if tienda:
            existing = TiendaPagina.objects.filter(tienda=tienda)
            if self.instance.pk:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                self.add_error('tienda', 'Esta tienda ya tiene una configuración en Administrar página.')
        return cleaned_data
