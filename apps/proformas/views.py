import json
from decimal import Decimal

import json
from io import BytesIO
from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import models
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from .models import Proforma, ProformaItem
from apps.inventario.models import Inventario
from apps.productos.models import Producto


def generar_codigo_proforma():
    contador = Proforma.objects.count() + 1
    return f'PROF-{contador:05d}'


def parse_decimal(value, default='0'):
    try:
        return Decimal(str(value or default))
    except Exception:
        return Decimal(str(default))


def aplicar_descuento(total, descuento_tipo, descuento_valor):
    if descuento_tipo == 'porcentaje':
        porcentaje = parse_decimal(descuento_valor)
        return total - (total * porcentaje / Decimal('100'))
    if descuento_tipo == 'fijo':
        return total - parse_decimal(descuento_valor)
    return total


def es_almacen(request):
    return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'almacen'


def es_tienda(request):
    return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'tienda'


def verificar_permiso_proformas(request):
    if not request.user.is_authenticated:
        return False
    if request.user.is_superuser or request.user.is_staff:
        return True
    return es_almacen(request) or es_tienda(request)


def obtener_stock_proforma(producto, perfil, tipo_ubicacion='tienda'):
    if perfil is None:
        return producto.stock
    if perfil.rol == 'almacen':
        return producto.stock
    if perfil.rol != 'tienda' or not perfil.tienda_id:
        return 0
    if tipo_ubicacion not in ['tienda', 'deposito']:
        tipo_ubicacion = 'tienda'
    return sum(Inventario.objects.filter(
        producto=producto,
        ubicacion__tienda_id=perfil.tienda_id,
        ubicacion__rol=tipo_ubicacion,
    ).values_list('cantidad', flat=True))


@login_required
def listar_proformas(request):
    if not verificar_permiso_proformas(request):
        messages.error(request, 'No tiene permiso para gestionar proformas.')
        return redirect('dashboard')
    proformas = Proforma.objects.filter(activo=True).select_related('usuario')
    return render(request, 'proformas/proformas.html', {'proformas': proformas})


@login_required
def modal_proforma(request):
    if not verificar_permiso_proformas(request):
        messages.error(request, 'No tiene permiso para gestionar proformas.')
        return redirect('dashboard')
    return render(request, 'proformas/modals/crear.html', {
        'es_tienda': es_tienda(request),
    })


@login_required
def ver_proforma(request, id):
    if not verificar_permiso_proformas(request):
        messages.error(request, 'No tiene permiso para gestionar proformas.')
        return redirect('dashboard')
    proforma = get_object_or_404(Proforma, pk=id, activo=True)
    return render(request, 'proformas/modals/ver.html', {'proforma': proforma})


@login_required
def editar_proforma(request, id):
    if not verificar_permiso_proformas(request):
        messages.error(request, 'No tiene permiso para gestionar proformas.')
        return redirect('dashboard')
    proforma = get_object_or_404(Proforma, pk=id, activo=True)
    return render(request, 'proformas/modals/editar.html', {'proforma': proforma})


@login_required
def eliminar_proforma(request, id):
    if not verificar_permiso_proformas(request):
        messages.error(request, 'No tiene permiso para gestionar proformas.')
        return redirect('dashboard')
    proforma = get_object_or_404(Proforma, pk=id, activo=True)
    if request.method == 'POST':
        proforma.activo = False
        proforma.save()
        return redirect('proformas:listar_proformas')
    return render(request, 'proformas/modals/eliminar.html', {'proforma': proforma})


@login_required
def buscar_productos(request):
    if not verificar_permiso_proformas(request):
        return JsonResponse({'productos': []}, status=403)
    query = request.GET.get('q', '').strip()
    perfil = getattr(request.user, 'perfil', None)
    tipo_ubicacion = request.GET.get('tipo_ubicacion', 'tienda')
    productos = Producto.objects.filter(activo=True)
    if query:
        productos = productos.filter(
            Q(nombre__icontains=query) | Q(codigo__icontains=query)
        )
    productos = productos.order_by('nombre')[:30]

    data = []
    for producto in productos:
        stock = obtener_stock_proforma(producto, perfil, tipo_ubicacion) if perfil else 0
        if stock <= 0:
            continue
        data.append({
            'id': producto.id,
            'codigo': producto.codigo,
            'nombre': producto.nombre,
            'stock': stock,
            'precio_unidad': float(producto.precio_unidad or 0),
            'precio_caja': float(producto.precio_caja or 0),
            'precio_mayor': float(producto.precio_mayor or 0),
            'unidades_por_caja': producto.unidades_por_caja or 1,
            'unidades_por_mayor': producto.unidades_por_mayor or 1,
        })

    return JsonResponse({'productos': data})


@login_required
def obtener_proforma(request, id):
    if not verificar_permiso_proformas(request):
        return JsonResponse({'error': 'No tiene permiso para gestionar proformas.'}, status=403)
    proforma = get_object_or_404(Proforma, pk=id, activo=True)
    items = []
    for item in proforma.items.select_related('producto').all():
        items.append({
            'id': item.id,
            'producto_id': item.producto_id,
            'producto_codigo': item.producto.codigo,
            'producto_nombre': item.producto.nombre,
            'cantidad': item.cantidad,
            'modalidad': item.modalidad,
            'precio_unitario': float(item.precio_unitario),
            'subtotal': float(item.subtotal),
        })

    return JsonResponse({
        'proforma': {
            'id': proforma.id,
            'codigo': proforma.codigo,
            'cliente': proforma.cliente,
            'nit': proforma.nit or '',
            'telefono': proforma.telefono or '',
            'razon_social': proforma.razon_social or '',
            'direccion': proforma.direccion or '',
            'comentario': proforma.comentario or '',
            'moneda': proforma.moneda,
            'tipo_cambio': float(proforma.tipo_cambio),
            'descuento_tipo': proforma.descuento_tipo,
            'descuento_valor': float(proforma.descuento_valor),
            'subtotal': float(proforma.subtotal),
            'total': float(proforma.total),
            'fecha_elaboracion': proforma.fecha_elaboracion.strftime('%Y-%m-%d %H:%M'),
            'fecha_actualizacion': proforma.fecha_actualizacion.strftime('%Y-%m-%d %H:%M'),
            'usuario': proforma.usuario.username if proforma.usuario else '',
        },
        'items': items,
    })


@login_required
def generar_pdf_proforma(request, id):
    if not verificar_permiso_proformas(request):
        messages.error(request, 'No tiene permiso para gestionar proformas.')
        return redirect('dashboard')
    proforma = get_object_or_404(Proforma, pk=id, activo=True)

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading1'],
        alignment=TA_LEFT,
        fontSize=16,
        leading=20,
        spaceAfter=12,
    )
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['BodyText'],
        alignment=TA_LEFT,
        fontSize=10,
        leading=14,
    )
    right_style = ParagraphStyle(
        'Right',
        parent=styles['BodyText'],
        alignment=TA_RIGHT,
        fontSize=10,
        leading=14,
    )

    elements = []
    elements.append(Paragraph(f'Proforma {proforma.codigo}', header_style))
    elements.append(Paragraph(f'<b>Cliente:</b> {proforma.cliente}', normal_style))
    elements.append(Paragraph(f'<b>NIT:</b> {proforma.nit or "-"}', normal_style))
    elements.append(Paragraph(f'<b>Teléfono:</b> {proforma.telefono or "-"}', normal_style))
    elements.append(Paragraph(f'<b>Razón social:</b> {proforma.razon_social or "-"}', normal_style))
    elements.append(Paragraph(f'<b>Dirección:</b> {proforma.direccion or "-"}', normal_style))
    elements.append(Paragraph(f'<b>Comentario:</b> {proforma.comentario or "-"}', normal_style))
    elements.append(Spacer(1, 12))

    metadata_table = Table([
        [
            Paragraph(f'<b>Fecha:</b> {proforma.fecha_elaboracion.strftime("%d/%m/%Y %H:%M")}', normal_style),
            Paragraph(f'<b>Moneda:</b> {proforma.moneda}', normal_style),
            Paragraph(f'<b>Tipo de cambio:</b> {float(proforma.tipo_cambio):,.2f}', normal_style),
        ]
    ], colWidths=[2.5 * inch, 2.0 * inch, 2.0 * inch])
    metadata_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(metadata_table)
    elements.append(Spacer(1, 18))

    items_data = [[
        Paragraph('<b>Producto</b>', normal_style),
        Paragraph('<b>Modalidad</b>', normal_style),
        Paragraph('<b>Cantidad</b>', normal_style),
        Paragraph('<b>Precio</b>', normal_style),
        Paragraph('<b>Subtotal</b>', normal_style),
    ]]

    for item in proforma.items.select_related('producto').all():
        items_data.append([
            Paragraph(item.producto.nombre, normal_style),
            Paragraph(item.modalidad.title(), normal_style),
            Paragraph(str(item.cantidad), right_style),
            Paragraph(f'{float(item.precio_unitario):,.2f}', right_style),
            Paragraph(f'{float(item.subtotal):,.2f}', right_style),
        ])

    items_table = Table(items_data, colWidths=[2.5 * inch, 1.2 * inch, 0.8 * inch, 1.1 * inch, 1.1 * inch])
    items_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 18))

    totals_data = [
        [Paragraph('<b>Subtotal</b>', normal_style), Paragraph(f'{float(proforma.subtotal):,.2f}', right_style)],
        [Paragraph('<b>Descuento</b>', normal_style), Paragraph(f'{float(proforma.descuento_valor):,.2f}', right_style)],
        [Paragraph('<b>Total</b>', normal_style), Paragraph(f'{float(proforma.total):,.2f}', right_style)],
    ]
    totals_table = Table(totals_data, colWidths=[4.0 * inch, 2.0 * inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(totals_table)

    doc.build(elements)
    buffer.seek(0)

    file_name = f'{proforma.codigo}.pdf'.replace('/', '-')
    return FileResponse(buffer, as_attachment=True, filename=file_name, content_type='application/pdf')


@login_required
def guardar_proforma(request):
    if not verificar_permiso_proformas(request):
        return JsonResponse({'success': False, 'error': 'No tiene permiso para gestionar proformas.'}, status=403)
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido.'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        data = request.POST.dict()

    cliente = data.get('cliente', '').strip()
    nit = data.get('nit', '').strip()
    telefono = data.get('telefono', '').strip()
    razon_social = data.get('razon_social', '').strip()
    direccion = data.get('direccion', '').strip()
    comentario = data.get('comentario', '').strip()
    moneda = data.get('moneda', 'BOB').upper()
    tipo_cambio = parse_decimal(data.get('tipo_cambio', '1'))
    descuento_tipo = data.get('descuento_tipo', 'ninguno')
    descuento_valor = parse_decimal(data.get('descuento_valor', '0'))
    tipo_ubicacion = data.get('tipo_ubicacion', 'tienda')
    items = data.get('items', [])

    if not cliente:
        return JsonResponse({'success': False, 'error': 'El nombre del cliente es obligatorio.'})
    if moneda not in ['BOB', 'USD']:
        return JsonResponse({'success': False, 'error': 'Moneda inválida.'})
    if tipo_cambio <= 0:
        return JsonResponse({'success': False, 'error': 'Tipo de cambio inválido.'})
    if not items or len(items) == 0:
        return JsonResponse({'success': False, 'error': 'Debe agregar al menos un producto.'})

    try:
        with transaction.atomic():
            proforma = Proforma.objects.create(
                codigo=generar_codigo_proforma(),
                cliente=cliente,
                nit=nit or None,
                telefono=telefono or None,
                razon_social=razon_social or None,
                direccion=direccion or None,
                comentario=comentario or None,
                moneda=moneda,
                tipo_cambio=tipo_cambio,
                descuento_tipo=descuento_tipo,
                descuento_valor=descuento_valor,
                subtotal=Decimal('0.00'),
                total=Decimal('0.00'),
                usuario=request.user,
            )

            subtotal_general = Decimal('0.00')
            for item in items:
                producto_id = item.get('producto_id')
                cantidad = int(item.get('cantidad', 0) or 0)
                modalidad = item.get('modalidad', 'unidad')
                precio_unitario = parse_decimal(item.get('precio_unitario', '0'))

                if cantidad <= 0:
                    raise ValueError('Cada producto debe tener una cantidad mayor a cero.')

                producto = Producto.objects.get(pk=producto_id)
                stock_disponible = obtener_stock_proforma(
                    producto, getattr(request.user, 'perfil', None), tipo_ubicacion
                )
                if cantidad > stock_disponible:
                    raise ValueError(
                        f'Stock insuficiente para "{producto.nombre}". '
                        f'Disponible: {stock_disponible}.'
                    )
                if precio_unitario <= 0:
                    precio_unitario = parse_decimal(producto.precio_unidad or '0')

                subtotal_item = precio_unitario * cantidad
                ProformaItem.objects.create(
                    proforma=proforma,
                    producto=producto,
                    cantidad=cantidad,
                    modalidad=modalidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal_item,
                )
                subtotal_general += subtotal_item

            total = aplicar_descuento(subtotal_general, descuento_tipo, descuento_valor)
            proforma.subtotal = subtotal_general
            proforma.total = total if total >= 0 else Decimal('0.00')
            proforma.save()

        return JsonResponse({
            'success': True,
            'proforma_id': proforma.id,
            'redirect': reverse('proformas:listar_proformas'),
        })
    except Producto.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Producto no encontrado.'}, status=404)
    except ValueError as exc:
        return JsonResponse({'success': False, 'error': str(exc)})
    except Exception as exc:
        return JsonResponse({'success': False, 'error': f'Error al guardar la proforma: {str(exc)}'})


@login_required
def actualizar_proforma(request, id):
    if not verificar_permiso_proformas(request):
        return JsonResponse({'success': False, 'error': 'No tiene permiso para gestionar proformas.'}, status=403)
    proforma = get_object_or_404(Proforma, pk=id, activo=True)
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido.'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        data = request.POST.dict()

    cliente = data.get('cliente', '').strip()
    nit = data.get('nit', '').strip()
    telefono = data.get('telefono', '').strip()
    razon_social = data.get('razon_social', '').strip()
    direccion = data.get('direccion', '').strip()
    comentario = data.get('comentario', '').strip()
    moneda = data.get('moneda', 'BOB').upper()
    tipo_cambio = parse_decimal(data.get('tipo_cambio', '1'))
    descuento_tipo = data.get('descuento_tipo', 'ninguno')
    descuento_valor = parse_decimal(data.get('descuento_valor', '0'))
    items = data.get('items', [])

    if not cliente:
        return JsonResponse({'success': False, 'error': 'El nombre del cliente es obligatorio.'})
    if moneda not in ['BOB', 'USD']:
        return JsonResponse({'success': False, 'error': 'Moneda inválida.'})
    if tipo_cambio <= 0:
        return JsonResponse({'success': False, 'error': 'Tipo de cambio inválido.'})
    if not items or len(items) == 0:
        return JsonResponse({'success': False, 'error': 'Debe agregar al menos un producto.'})

    try:
        with transaction.atomic():
            proforma.cliente = cliente
            proforma.nit = nit or None
            proforma.telefono = telefono or None
            proforma.razon_social = razon_social or None
            proforma.direccion = direccion or None
            proforma.comentario = comentario or None
            proforma.moneda = moneda
            proforma.tipo_cambio = tipo_cambio
            proforma.descuento_tipo = descuento_tipo
            proforma.descuento_valor = descuento_valor
            proforma.usuario = request.user
            proforma.save()

            proforma.items.all().delete()
            subtotal_general = Decimal('0.00')
            for item in items:
                producto_id = item.get('producto_id')
                cantidad = int(item.get('cantidad', 0) or 0)
                modalidad = item.get('modalidad', 'unidad')
                precio_unitario = parse_decimal(item.get('precio_unitario', '0'))

                if cantidad <= 0:
                    raise ValueError('Cada producto debe tener una cantidad mayor a cero.')

                producto = Producto.objects.get(pk=producto_id)
                if precio_unitario <= 0:
                    precio_unitario = parse_decimal(producto.precio_unidad or '0')

                subtotal_item = precio_unitario * cantidad
                ProformaItem.objects.create(
                    proforma=proforma,
                    producto=producto,
                    cantidad=cantidad,
                    modalidad=modalidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal_item,
                )
                subtotal_general += subtotal_item

            total = aplicar_descuento(subtotal_general, descuento_tipo, descuento_valor)
            proforma.subtotal = subtotal_general
            proforma.total = total if total >= 0 else Decimal('0.00')
            proforma.save()

        return JsonResponse({
            'success': True,
            'proforma_id': proforma.id,
            'redirect': reverse('proformas:listar_proformas'),
        })
    except Producto.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Producto no encontrado.'}, status=404)
    except ValueError as exc:
        return JsonResponse({'success': False, 'error': str(exc)})
    except Exception as exc:
        return JsonResponse({'success': False, 'error': f'Error al actualizar la proforma: {str(exc)}'})
