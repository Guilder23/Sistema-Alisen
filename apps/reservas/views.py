from decimal import Decimal
import json

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q, Sum
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse

from apps.productos.models import Producto
from apps.inventario.models import Inventario
from apps.ventas.models import DetalleVenta, Venta
from .models import PagoReserva, ReservaItem, ReservaProducto


def obtener_inventarios_reserva(producto, perfil, tipo_ubicacion):
    if tipo_ubicacion not in ['tienda', 'deposito']:
        return Inventario.objects.none()
    if not getattr(perfil, 'tienda_id', None):
        return Inventario.objects.none()

    return Inventario.objects.filter(
        producto=producto,
        ubicacion__tienda_id=perfil.tienda_id,
        ubicacion__rol=tipo_ubicacion,
    ).order_by('fecha_actualizacion')


def descontar_stock_reserva(producto, cantidad, perfil, tipo_ubicacion):
    inventarios = list(obtener_inventarios_reserva(producto, perfil, tipo_ubicacion))
    stock_total = sum(inv.cantidad for inv in inventarios)
    if stock_total < cantidad:
        raise ValueError(f'No hay suficiente stock en {tipo_ubicacion} para "{producto.nombre}".')

    restante = cantidad
    for inv in inventarios:
        if restante <= 0:
            break
        if inv.cantidad >= restante:
            inv.cantidad -= restante
            inv.save(update_fields=['cantidad', 'fecha_actualizacion'])
            restante = 0
        else:
            restante -= inv.cantidad
            inv.cantidad = 0
            inv.save(update_fields=['cantidad', 'fecha_actualizacion'])

    if restante > 0:
        raise ValueError(f'No se pudo reservar completamente "{producto.nombre}".')


def devolver_stock_reserva(producto, cantidad, perfil, tipo_ubicacion):
    inventarios = list(obtener_inventarios_reserva(producto, perfil, tipo_ubicacion))
    if not inventarios:
        Inventario.objects.create(producto=producto, ubicacion=perfil, cantidad=cantidad)
        return

    restante = cantidad
    for inv in inventarios:
        if restante <= 0:
            break
        inv.cantidad += restante
        inv.save(update_fields=['cantidad', 'fecha_actualizacion'])
        restante = 0

    if restante > 0:
        inventarios[0].cantidad += restante
        inventarios[0].save(update_fields=['cantidad', 'fecha_actualizacion'])


def parse_decimal(value, default='0'):
    try:
        return Decimal(str(value or default))
    except Exception:
        return Decimal(str(default))


def generar_codigo_venta_desde_reserva():
    ultima = Venta.objects.order_by('-id').first()
    if ultima and ultima.codigo:
        try:
            numero = int(ultima.codigo.split('-')[1]) + 1
        except (IndexError, ValueError):
            numero = Venta.objects.count() + 1
    else:
        numero = 1
    return f'VTA-{numero:04d}'


def convertir_reserva_en_venta(reserva, usuario):
    venta_existente = Venta.objects.filter(
        cliente=reserva.cliente,
        ubicacion=reserva.ubicacion,
        total=reserva.total,
        subtotal=reserva.subtotal,
        fecha_elaboracion__date=reserva.fecha_reserva.date(),
    ).count()
    if venta_existente > 0:
        return Venta.objects.filter(
            cliente=reserva.cliente,
            ubicacion=reserva.ubicacion,
            total=reserva.total,
            subtotal=reserva.subtotal,
            fecha_elaboracion__date=reserva.fecha_reserva.date(),
        ).order_by('-id').first()

    venta = Venta.objects.create(
        codigo=generar_codigo_venta_desde_reserva(),
        ubicacion=reserva.ubicacion,
        cliente=reserva.cliente,
        telefono=reserva.telefono,
        razon_social=reserva.razon_social,
        direccion=reserva.direccion,
        comentario=reserva.comentario,
        tipo_pago=reserva.tipo_pago,
        metodo_pago=reserva.metodo_pago,
        estado='completada',
        moneda=reserva.moneda,
        tipo_cambio=reserva.tipo_cambio,
        vendedor=usuario,
        subtotal=reserva.subtotal,
        descuento=reserva.descuento,
        descuento_tipo=reserva.descuento_tipo,
        descuento_valor=reserva.descuento_valor,
        total=reserva.total,
    )

    for item in reserva.items.select_related('producto'):
        DetalleVenta.objects.create(
            venta=venta,
            producto=item.producto,
            cantidad=item.cantidad,
            cantidad_cajas=0,
            tipo_vendedor=reserva.inventario_tipo or 'tienda',
            modalidad=item.modalidad,
            precio_unitario=item.precio_unitario,
            subtotal=item.subtotal,
        )

    return venta


def aplicar_descuento(total, descuento_tipo, descuento_valor):
    total = Decimal(str(total))
    if descuento_tipo == 'porcentaje':
        porcentaje = parse_decimal(descuento_valor)
        return total - (total * porcentaje / Decimal('100'))
    if descuento_tipo == 'fijo':
        return total - parse_decimal(descuento_valor)
    return total


@login_required
def listar_reservas(request):
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        messages.error(request, 'Solo usuarios con rol tienda pueden acceder a reservas.')
        return redirect('dashboard')

    perfil = request.user.perfil
    reservas = ReservaProducto.objects.filter(ubicacion=perfil).select_related('ubicacion', 'registrado_por').prefetch_related('items__producto', 'pagos').order_by('-fecha_reserva')

    context = {'reservas': reservas, 'perfil': perfil, 'titulo': 'Reservas de productos'}
    return render(request, 'reservas/reservas.html', context)


@login_required
def buscar_productos(request):
    perfil = getattr(request.user, 'perfil', None)
    if not perfil or perfil.rol != 'tienda':
        return JsonResponse({'productos': []}, status=403)

    query = request.GET.get('q', '').strip()
    tipo_ubicacion = (request.GET.get('tipo_ubicacion') or 'tienda').strip().lower()
    if tipo_ubicacion not in ['tienda', 'deposito']:
        tipo_ubicacion = 'tienda'

    inventario_qs = Inventario.objects.filter(producto__activo=True, ubicacion__tienda_id=perfil.tienda_id)
    if perfil.tienda_id:
        inventario_qs = inventario_qs.filter(ubicacion__rol__in=['tienda', 'deposito'])
        if tipo_ubicacion == 'deposito':
            inventario_qs = inventario_qs.filter(ubicacion__rol='deposito')
        else:
            inventario_qs = inventario_qs.filter(ubicacion__rol='tienda')
    else:
        inventario_qs = inventario_qs.none()

    stock_por_producto = {}
    for inventario in inventario_qs.select_related('producto', 'ubicacion'):
        stock_por_producto[inventario.producto_id] = stock_por_producto.get(inventario.producto_id, 0) + inventario.cantidad

    producto_ids = list(stock_por_producto.keys())
    productos = Producto.objects.filter(id__in=producto_ids, activo=True)
    if query:
        productos = productos.filter(Q(nombre__icontains=query) | Q(codigo__icontains=query))

    productos = productos.order_by('nombre')[:30]
    data = []
    for producto in productos:
        stock = stock_por_producto.get(producto.id, 0)
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
            'tipo_ubicacion': tipo_ubicacion,
        })

    return JsonResponse({'productos': data})


@login_required
def crear_reserva(request):
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        return redirect('dashboard')
    return render(request, 'reservas/crear.html', {'perfil': request.user.perfil})


@login_required
def guardar_reserva(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Método no permitido.'}, status=405)

    perfil = getattr(request.user, 'perfil', None)
    if not perfil or perfil.rol != 'tienda':
        return JsonResponse({'success': False, 'error': 'Solo usuarios de tienda pueden registrar reservas.'}, status=403)

    try:
        data = json.loads(request.body)
    except Exception:
        data = request.POST.dict()

    tipo_ubicacion = (data.get('ubicacion_tipo') or 'tienda').strip().lower()
    if tipo_ubicacion not in ['tienda', 'deposito']:
        return JsonResponse({'success': False, 'error': 'Debe seleccionar inventario de tienda o depósito.'})

    cliente = (data.get('cliente') or '').strip()
    nit = (data.get('nit') or '').strip()
    telefono = (data.get('telefono') or '').strip()
    razon_social = (data.get('razon_social') or '').strip()
    direccion = (data.get('direccion') or '').strip()
    comentario = (data.get('comentario') or '').strip()
    tipo_pago = (data.get('tipo_pago') or 'contado').strip().lower()
    metodo_pago = (data.get('metodo_pago') or 'efectivo').strip().lower()
    moneda = (data.get('moneda') or 'BOB').upper()
    tipo_cambio = parse_decimal(data.get('tipo_cambio', '1'))
    descuento_tipo = (data.get('descuento_tipo') or 'ninguno').strip().lower()
    descuento_valor = parse_decimal(data.get('descuento_valor', '0'))
    items = data.get('items') or []

    if not cliente:
        return JsonResponse({'success': False, 'error': 'El nombre del cliente es obligatorio.'})
    if tipo_pago not in ['contado', 'credito']:
        return JsonResponse({'success': False, 'error': 'Tipo de pago inválido.'})
    if metodo_pago not in ['efectivo', 'transferencia', 'qr']:
        return JsonResponse({'success': False, 'error': 'Método de pago inválido.'})
    if moneda not in ['BOB', 'USD']:
        return JsonResponse({'success': False, 'error': 'Moneda inválida.'})
    if tipo_cambio <= 0:
        return JsonResponse({'success': False, 'error': 'Tipo de cambio inválido.'})
    if not items:
        return JsonResponse({'success': False, 'error': 'Debe agregar al menos un producto.'})

    try:
        with transaction.atomic():
            reserva = ReservaProducto.objects.create(
                codigo=f'R-{ReservaProducto.objects.count() + 1:05d}',
                ubicacion=perfil,
                cliente=cliente,
                telefono=telefono or None,
                nit=nit or None,
                razon_social=razon_social or None,
                direccion=direccion or None,
                comentario=comentario or None,
                tipo_pago=tipo_pago,
                metodo_pago=metodo_pago,
                moneda=moneda,
                tipo_cambio=tipo_cambio,
                descuento_tipo=descuento_tipo,
                descuento_valor=descuento_valor,
                subtotal=Decimal('0.00'),
                total=Decimal('0.00'),
                registrado_por=request.user,
                estado='pendiente',
                inventario_tipo=tipo_ubicacion,
            )

            subtotal_general = Decimal('0.00')
            for item in items:
                producto_id = item.get('producto_id')
                cantidad = int(item.get('cantidad', 0) or 0)
                modalidad = (item.get('modalidad') or 'unidad').lower()
                precio_unitario = parse_decimal(item.get('precio_unitario', '0'))

                if cantidad <= 0:
                    raise ValueError('Cada producto debe tener una cantidad mayor a cero.')
                if modalidad not in ['unidad', 'caja', 'mayor']:
                    raise ValueError('La modalidad del producto es inválida.')

                producto = Producto.objects.get(pk=producto_id)
                if precio_unitario <= 0:
                    precio_unitario = parse_decimal(producto.precio_unidad or '0')

                descontar_stock_reserva(producto, cantidad, perfil, tipo_ubicacion)

                subtotal_item = precio_unitario * Decimal(str(cantidad))
                ReservaItem.objects.create(
                    reserva=reserva,
                    producto=producto,
                    cantidad=cantidad,
                    modalidad=modalidad,
                    precio_unitario=precio_unitario,
                    subtotal=subtotal_item,
                )
                subtotal_general += subtotal_item

            total = aplicar_descuento(subtotal_general, descuento_tipo, descuento_valor)
            total = max(total, Decimal('0.00'))
            reserva.subtotal = subtotal_general
            reserva.descuento = subtotal_general - total if total < subtotal_general else Decimal('0.00')
            reserva.total = total
            reserva.save()

        return JsonResponse({'success': True, 'redirect': reverse('reservas:listar_reservas'), 'reserva_id': reserva.id, 'codigo': reserva.codigo})
    except Producto.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Producto no encontrado.'}, status=404)
    except ValueError as exc:
        return JsonResponse({'success': False, 'error': str(exc)})
    except Exception as exc:
        return JsonResponse({'success': False, 'error': f'Error al guardar la reserva: {str(exc)}'})


@login_required
def ver_reserva(request, pk):
    reserva = get_object_or_404(ReservaProducto, pk=pk)
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        messages.error(request, 'No tienes permisos para ver esta reserva.')
        return redirect('dashboard')

    pagos = reserva.pagos.all()
    total_pagado = reserva.total_pagado
    saldo = reserva.saldo_pendiente

    context = {'reserva': reserva, 'pagos': pagos, 'items': reserva.items.select_related('producto').all(), 'total_pagado': total_pagado, 'saldo': saldo}
    return render(request, 'reservas/ver.html', context)


@login_required
def editar_reserva(request, pk):
    reserva = get_object_or_404(ReservaProducto, pk=pk)
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        messages.error(request, 'No tienes permisos para editar reservas.')
        return redirect('dashboard')

    if request.method == 'POST':
        reserva.cliente = request.POST.get('cliente', reserva.cliente).strip()
        reserva.nit = request.POST.get('nit', reserva.nit).strip() or None
        reserva.telefono = request.POST.get('telefono', reserva.telefono).strip() or None
        reserva.razon_social = request.POST.get('razon_social', reserva.razon_social).strip() or None
        reserva.direccion = request.POST.get('direccion', reserva.direccion).strip() or None
        reserva.comentario = request.POST.get('comentario', reserva.comentario).strip() or None
        reserva.observaciones = request.POST.get('observaciones', reserva.observaciones).strip() or None
        reserva.save()
        messages.success(request, 'Reserva actualizada correctamente.')
        return redirect('reservas:listar_reservas')

    return render(request, 'reservas/editar.html', {'reserva': reserva, 'items': reserva.items.select_related('producto').all()})


@login_required
def amortizar_reserva(request, pk):
    reserva = get_object_or_404(ReservaProducto, pk=pk)
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        messages.error(request, 'No tienes permisos para registrar pagos.')
        return redirect('dashboard')

    if request.method == 'POST':
        monto = parse_decimal(request.POST.get('monto', '0'))
        metodo_pago = (request.POST.get('metodo_pago') or 'efectivo').strip().lower()
        observaciones = request.POST.get('observaciones', '').strip()
        comprobante = request.FILES.get('comprobante')

        if monto <= 0:
            messages.error(request, 'El pago debe ser mayor a 0.')
            return redirect('reservas:amortizar_reserva', pk=pk)
        if metodo_pago not in ['efectivo', 'transferencia', 'qr']:
            messages.error(request, 'Método de pago inválido.')
            return redirect('reservas:amortizar_reserva', pk=pk)

        total_pagado = reserva.total_pagado
        saldo = reserva.saldo_pendiente
        if monto > saldo:
            messages.error(request, 'El monto supera el saldo pendiente de la reserva.')
            return redirect('reservas:amortizar_reserva', pk=pk)

        PagoReserva.objects.create(
            reserva=reserva,
            monto=monto,
            moneda=reserva.moneda,
            metodo_pago=metodo_pago,
            comprobante=comprobante,
            observaciones=observaciones,
            registrado_por=request.user,
        )

        nuevo_total_pagado = reserva.total_pagado
        if nuevo_total_pagado >= reserva.total:
            reserva.estado = 'completada'
            convertir_reserva_en_venta(reserva, request.user)
        elif nuevo_total_pagado > 0:
            reserva.estado = 'parcial'
        reserva.save()

        messages.success(request, f'Pago de {monto} registrado correctamente.')
        return redirect('reservas:listar_reservas')

    return render(request, 'reservas/amortizar.html', {'reserva': reserva})


@login_required
def anular_reserva(request, pk):
    reserva = get_object_or_404(ReservaProducto, pk=pk)
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        messages.error(request, 'No tienes permisos para anular reservas.')
        return redirect('dashboard')

    if request.method == 'POST':
        motivo = request.POST.get('motivo', '').strip()
        for item in reserva.items.select_related('producto'):
            devolver_stock_reserva(item.producto, item.cantidad, reserva.ubicacion, reserva.inventario_tipo or 'tienda')
        if motivo:
            base_observacion = reserva.observaciones or ''
            reserva.observaciones = f'{base_observacion} | Anulada: {motivo}'.strip(' |')
        reserva.estado = 'anulada'
        reserva.save()
        messages.success(request, 'Reserva anulada correctamente.')
        return redirect('reservas:listar_reservas')

    return render(request, 'reservas/modals/anular.html', {'reserva': reserva})


@login_required
def eliminar_reserva(request, pk):
    reserva = get_object_or_404(ReservaProducto, pk=pk)
    if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'tienda':
        messages.error(request, 'No tienes permisos para eliminar reservas.')
        return redirect('dashboard')

    if request.method == 'POST':
        for item in reserva.items.select_related('producto'):
            devolver_stock_reserva(item.producto, item.cantidad, reserva.ubicacion, reserva.inventario_tipo or 'tienda')
        reserva.delete()
        messages.success(request, 'Reserva eliminada correctamente.')
        return redirect('reservas:listar_reservas')

    return render(request, 'reservas/eliminar.html', {'reserva': reserva})
