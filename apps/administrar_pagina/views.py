from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from apps.tiendas.models import Tienda
from .forms import BannerForm, TiendaPaginaForm
from .models import Banner, TiendaPagina


def es_administrador(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)


administrador_requerido = user_passes_test(es_administrador)


def respuesta_modal(request, template, context, success_url=None):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        if success_url:
            return JsonResponse({'ok': True, 'redirect_url': success_url})
        return JsonResponse({'ok': True})
    status = 400 if request.method == 'POST' else 200
    return render(request, template, context, status=status)


@login_required
@administrador_requerido
def listar_banners(request):
    banners = Banner.objects.all()
    return render(request, 'administrar_pagina/banners/banners.html', {'banners': banners})


@login_required
@administrador_requerido
def crear_banner(request):
    form = BannerForm(request.POST or None, request.FILES or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'El banner se creó correctamente.')
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'ok': True, 'redirect_url': reverse('administrar_pagina:listar_banners')})
        return redirect('administrar_pagina:listar_banners')
    return respuesta_modal(request, 'administrar_pagina/banners/modals/crear.html', {
        'form': form,
        'action': reverse('administrar_pagina:crear_banner'),
    })


@login_required
@administrador_requerido
def ver_banner(request, pk):
    banner = get_object_or_404(Banner, pk=pk)
    return render(request, 'administrar_pagina/banners/modals/ver.html', {'banner': banner})


@login_required
@administrador_requerido
def editar_banner(request, pk):
    banner = get_object_or_404(Banner, pk=pk)
    imagen_anterior = banner.imagen.name
    form = BannerForm(request.POST or None, request.FILES or None, instance=banner)
    if request.method == 'POST' and form.is_valid():
        banner = form.save()
        if imagen_anterior != banner.imagen.name:
            banner.imagen.storage.delete(imagen_anterior)
        messages.success(request, 'El banner se actualizó correctamente.')
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'ok': True, 'redirect_url': reverse('administrar_pagina:listar_banners')})
        return redirect('administrar_pagina:listar_banners')
    return respuesta_modal(request, 'administrar_pagina/banners/modals/editar.html', {
        'form': form,
        'banner': banner,
        'action': reverse('administrar_pagina:editar_banner', args=[banner.pk]),
    })


@login_required
@administrador_requerido
def eliminar_banner(request, pk):
    banner = get_object_or_404(Banner, pk=pk)
    if request.method == 'POST':
        nombre_imagen = banner.imagen.name
        almacenamiento = banner.imagen.storage
        banner.delete()
        almacenamiento.delete(nombre_imagen)
        messages.success(request, 'El banner se eliminó correctamente.')
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'ok': True, 'redirect_url': reverse('administrar_pagina:listar_banners')})
        return redirect('administrar_pagina:listar_banners')
    return render(request, 'administrar_pagina/banners/modals/eliminar.html', {'banner': banner})


@login_required
@administrador_requerido
@require_POST
def cambiar_publicacion(request, pk):
    banner = get_object_or_404(Banner, pk=pk)
    banner.publicado = not banner.publicado
    banner.save(update_fields=['publicado', 'fecha_actualizacion'])
    estado = 'publicado' if banner.publicado else 'retirado de la página'
    messages.success(request, f'El banner fue {estado} correctamente.')
    return redirect('administrar_pagina:listar_banners')


def contexto_form_tienda(form, **extra):
    tiendas = Tienda.objects.select_related('almacen').order_by('nombre')
    return {
        'form': form,
        'tiendas_json': [
            {
                'id': tienda.pk,
                'nombre': tienda.nombre,
                'tipo': tienda.get_tipo_display(),
                'direccion': tienda.direccion,
                'ciudad': tienda.ciudad,
                'departamento': tienda.departamento,
                'descripcion': tienda.descripcion or '',
                'maps': tienda.enlace_google_maps,
                'foto': tienda.foto.url if tienda.foto else '',
                'estado': tienda.get_estado_display(),
            }
            for tienda in tiendas
        ],
        **extra,
    }


@login_required
@administrador_requerido
def listar_tiendas_pagina(request):
    tiendas_pagina = TiendaPagina.objects.select_related('tienda').all()
    return render(request, 'administrar_pagina/tiendas/tiendas.html', {'tiendas_pagina': tiendas_pagina})


@login_required
@administrador_requerido
def crear_tienda_pagina(request):
    form = TiendaPaginaForm(request.POST or None, request.FILES or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'La tienda se añadió a la administración de la página.')
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'ok': True, 'redirect_url': reverse('administrar_pagina:listar_tiendas_pagina')})
        return redirect('administrar_pagina:listar_tiendas_pagina')
    return respuesta_modal(
        request,
        'administrar_pagina/tiendas/modals/crear.html',
        contexto_form_tienda(
            form,
            titulo='Añadir tienda a la página',
            boton='Guardar tienda',
            action=reverse('administrar_pagina:crear_tienda_pagina'),
        ),
    )


@login_required
@administrador_requerido
def ver_tienda_pagina(request, pk):
    tienda_pagina = get_object_or_404(
        TiendaPagina.objects.select_related('tienda'),
        pk=pk,
    )
    return render(request, 'administrar_pagina/tiendas/modals/ver.html', {'tienda_pagina': tienda_pagina})


@login_required
@administrador_requerido
def editar_tienda_pagina(request, pk):
    tienda_pagina = get_object_or_404(TiendaPagina.objects.select_related('tienda'), pk=pk)
    imagen_anterior = tienda_pagina.imagen.name if tienda_pagina.imagen else None
    form = TiendaPaginaForm(request.POST or None, request.FILES or None, instance=tienda_pagina)
    if request.method == 'POST' and form.is_valid():
        tienda_pagina = form.save()
        if imagen_anterior and imagen_anterior != (tienda_pagina.imagen.name if tienda_pagina.imagen else None):
            tienda_pagina.imagen.storage.delete(imagen_anterior)
        messages.success(request, 'La tienda se actualizó en la página.')
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'ok': True, 'redirect_url': reverse('administrar_pagina:listar_tiendas_pagina')})
        return redirect('administrar_pagina:listar_tiendas_pagina')
    return respuesta_modal(
        request,
        'administrar_pagina/tiendas/modals/editar.html',
        contexto_form_tienda(
            form,
            titulo='Editar tienda en la página',
            boton='Guardar cambios',
            tienda_pagina=tienda_pagina,
            action=reverse('administrar_pagina:editar_tienda_pagina', args=[tienda_pagina.pk]),
        ),
    )


@login_required
@administrador_requerido
def eliminar_tienda_pagina(request, pk):
    tienda_pagina = get_object_or_404(TiendaPagina.objects.select_related('tienda'), pk=pk)
    if request.method == 'POST':
        imagen_nombre = tienda_pagina.imagen.name if tienda_pagina.imagen else None
        almacenamiento = tienda_pagina.imagen.storage if tienda_pagina.imagen else None
        tienda_pagina.delete()
        if imagen_nombre:
            almacenamiento.delete(imagen_nombre)
        messages.success(request, 'La tienda se retiró de la página.')
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'ok': True, 'redirect_url': reverse('administrar_pagina:listar_tiendas_pagina')})
        return redirect('administrar_pagina:listar_tiendas_pagina')
    return render(
        request,
        'administrar_pagina/tiendas/modals/eliminar.html',
        {'tienda_pagina': tienda_pagina},
    )


@login_required
@administrador_requerido
@require_POST
def cambiar_publicacion_tienda(request, pk):
    tienda_pagina = get_object_or_404(TiendaPagina.objects.select_related('tienda'), pk=pk)
    tienda_pagina.publicado = not tienda_pagina.publicado
    tienda_pagina.save(update_fields=['publicado', 'fecha_actualizacion'])
    estado = 'publicada' if tienda_pagina.publicado else 'retirada de la página'
    messages.success(request, f'La tienda {tienda_pagina.tienda.nombre} fue {estado}.')
    return redirect('administrar_pagina:listar_tiendas_pagina')
