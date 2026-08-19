from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_http_methods

from apps.productos.models import Categoria
from .models import Subcategoria


def es_almacen(request):
    return request.user.is_superuser or request.user.is_staff or (
        hasattr(request.user, 'perfil') and request.user.perfil.rol == 'almacen'
    )


def respuesta_error(request, mensaje):
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': False, 'error': mensaje})
    messages.error(request, mensaje)
    return redirect('subcategorias:listar')


@login_required
def listar_subcategorias(request):
    if not es_almacen(request):
        messages.error(request, 'Solo el personal de almacén puede gestionar subcategorías.')
        return redirect('dashboard')
    buscar = request.GET.get('buscar', '').strip()
    estado = request.GET.get('estado', '').strip()
    categoria_id = request.GET.get('categoria', '').strip()
    subcategorias = Subcategoria.objects.select_related('categoria', 'creado_por').all()
    if buscar:
        subcategorias = subcategorias.filter(Q(nombre__icontains=buscar) | Q(descripcion__icontains=buscar) | Q(categoria__nombre__icontains=buscar))
    if estado == 'activo':
        subcategorias = subcategorias.filter(activo=True)
    elif estado == 'inactivo':
        subcategorias = subcategorias.filter(activo=False)
    if categoria_id:
        subcategorias = subcategorias.filter(categoria_id=categoria_id)
    page_obj = Paginator(subcategorias.order_by('-fecha_creacion'), 10).get_page(request.GET.get('page'))
    return render(request, 'subcategorias/subcategorias.html', {
        'subcategorias': page_obj,
        'categorias': Categoria.objects.filter(activo=True).order_by('nombre'),
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
        'buscar': buscar,
        'estado': estado,
        'categoria_id': categoria_id,
    })


@login_required
def listar_subcategorias_json(request):
    if not es_almacen(request):
        return JsonResponse({'error': 'No autorizado'}, status=403)
    categoria_id = request.GET.get('categoria', '').strip()
    subcategorias = Subcategoria.objects.filter(activo=True)
    if categoria_id:
        subcategorias = subcategorias.filter(categoria_id=categoria_id)
    return JsonResponse({
        'subcategorias': list(subcategorias.order_by('nombre').values('id', 'nombre', 'categoria_id'))
    })


@login_required
@require_http_methods(['POST'])
def crear_subcategoria(request):
    if not es_almacen(request):
        return respuesta_error(request, 'No tiene permisos para crear subcategorías.')
    nombre = request.POST.get('nombre', '').strip()
    descripcion = request.POST.get('descripcion', '').strip()
    categoria_id = request.POST.get('categoria', '').strip()
    activo = request.POST.get('activo') == 'on'
    categoria = Categoria.objects.filter(id=categoria_id, activo=True).first()
    if not nombre or not categoria:
        return respuesta_error(request, 'Nombre y categoría son obligatorios.')
    if Subcategoria.objects.filter(categoria=categoria, nombre__iexact=nombre).exists():
        return respuesta_error(request, f'La subcategoría "{nombre}" ya existe en esa categoría.')
    subcategoria = Subcategoria.objects.create(categoria=categoria, nombre=nombre, descripcion=descripcion, activo=activo, creado_por=request.user)
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'id': subcategoria.id})
    messages.success(request, f'Subcategoría "{nombre}" creada correctamente.')
    return redirect('subcategorias:listar')


@login_required
def obtener_subcategoria(request, id):
    if not es_almacen(request):
        return JsonResponse({'error': 'No autorizado'}, status=403)
    item = get_object_or_404(Subcategoria.objects.select_related('categoria', 'creado_por'), id=id)
    return JsonResponse({
        'id': item.id, 'nombre': item.nombre, 'descripcion': item.descripcion or '',
        'categoria_id': item.categoria_id, 'categoria_nombre': item.categoria.nombre,
        'activo': item.activo,
        'creado_por': item.creado_por.get_username() if item.creado_por else '',
        'fecha_creacion': item.fecha_creacion.strftime('%d/%m/%Y %H:%M'),
        'fecha_actualizacion': item.fecha_actualizacion.strftime('%d/%m/%Y %H:%M'),
    })


@login_required
@require_http_methods(['POST'])
def editar_subcategoria(request, id):
    if not es_almacen(request):
        return respuesta_error(request, 'No tiene permisos para editar subcategorías.')
    item = get_object_or_404(Subcategoria, id=id)
    nombre = request.POST.get('nombre', '').strip()
    categoria = Categoria.objects.filter(id=request.POST.get('categoria'), activo=True).first()
    if not nombre or not categoria:
        return respuesta_error(request, 'Nombre y categoría son obligatorios.')
    if Subcategoria.objects.filter(categoria=categoria, nombre__iexact=nombre).exclude(id=id).exists():
        return respuesta_error(request, 'Ya existe otra subcategoría con ese nombre en la categoría.')
    item.nombre = nombre
    item.categoria = categoria
    item.descripcion = request.POST.get('descripcion', '').strip()
    item.activo = request.POST.get('activo') == 'on'
    item.save()
    messages.success(request, 'Subcategoría actualizada correctamente.')
    return redirect('subcategorias:listar')


@login_required
@require_http_methods(['POST'])
def eliminar_subcategoria(request, id):
    if not es_almacen(request):
        return respuesta_error(request, 'No tiene permisos para cambiar subcategorías.')
    item = get_object_or_404(Subcategoria, id=id)
    item.activo = not item.activo
    item.save(update_fields=['activo', 'fecha_actualizacion'])
    messages.success(request, f'Subcategoría {"activada" if item.activo else "desactivada"}.')
    return redirect('subcategorias:listar')
