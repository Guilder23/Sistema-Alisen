from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponse, JsonResponse, HttpResponseForbidden
from django.db.models import Q, Sum, Count
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from apps.productos.models import Producto, ProductoContenedor, Contenedor, Categoria
from apps.ventas.models import Venta, DetalleVenta
from apps.usuarios.models import PerfilUsuario
from django.contrib.auth.models import User
from datetime import datetime
from decimal import Decimal
from io import BytesIO

@login_required
def index_reportes(request):
    return render(request, 'reportes/index.html')

@login_required
def reporte_inventario(request):
    return HttpResponse('Reporte de Inventario PDF')

@login_required
def reporte_ventas(request):
    """Vista para reporte de ventas con filtros y análisis"""
    
    # Obtener todas las ventas con sus relaciones
    ventas = Venta.objects.select_related(
        'ubicacion', 'vendedor'
    ).prefetch_related('detalles')
    
    # Obtener filtros de la petición
    buscar = request.GET.get('buscar', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    estado = request.GET.get('estado', '').strip()
    tipo_pago = request.GET.get('tipo_pago', '').strip()
    metodo_pago = request.GET.get('metodo_pago', '').strip()
    vendedor_id = request.GET.get('vendedor', '').strip()
    moneda = request.GET.get('moneda', '').strip()
    monto_minimo = request.GET.get('monto_minimo', '').strip()
    monto_maximo = request.GET.get('monto_maximo', '').strip()
    ordenar_por = request.GET.get('ordenar', 'fecha_desc').strip()
    
    # Aplicar filtros
    if buscar:
        ventas = ventas.filter(
            Q(codigo__icontains=buscar) |
            Q(cliente__icontains=buscar) |
            Q(razon_social__icontains=buscar) |
            Q(telefono__icontains=buscar)
        )
    
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, '%Y-%m-%d')
            ventas = ventas.filter(fecha_elaboracion__gte=fecha_desde_dt)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            from datetime import timedelta
            fecha_hasta_dt = datetime.strptime(fecha_hasta, '%Y-%m-%d')
            # Incluir todo el día hasta las 23:59:59
            fecha_hasta_dt = fecha_hasta_dt + timedelta(days=1) - timedelta(seconds=1)
            ventas = ventas.filter(fecha_elaboracion__lte=fecha_hasta_dt)
        except ValueError:
            pass
    
    if estado:
        ventas = ventas.filter(estado=estado)
    
    if tipo_pago:
        ventas = ventas.filter(tipo_pago=tipo_pago)
    
    if metodo_pago:
        ventas = ventas.filter(metodo_pago=metodo_pago)
    
    if vendedor_id:
        ventas = ventas.filter(vendedor_id=vendedor_id)
    
    if moneda:
        ventas = ventas.filter(moneda=moneda)
    
    if monto_minimo:
        try:
            monto_min = float(monto_minimo)
            ventas = ventas.filter(total__gte=monto_min)
        except ValueError:
            pass
    
    if monto_maximo:
        try:
            monto_max = float(monto_maximo)
            ventas = ventas.filter(total__lte=monto_max)
        except ValueError:
            pass
    
    # Aplicar ordenamiento
    if ordenar_por == 'fecha_desc':
        ventas = ventas.order_by('-fecha_elaboracion')
    elif ordenar_por == 'fecha_asc':
        ventas = ventas.order_by('fecha_elaboracion')
    elif ordenar_por == 'codigo':
        ventas = ventas.order_by('codigo')
    elif ordenar_por == 'cliente':
        ventas = ventas.order_by('cliente')
    elif ordenar_por == 'total_desc':
        ventas = ventas.order_by('-total')
    elif ordenar_por == 'total_asc':
        ventas = ventas.order_by('total')
    elif ordenar_por == 'estado':
        ventas = ventas.order_by('estado')
    
    # Calcular totales antes de paginar
    total_ventas = ventas.count()
    
    # Calcular totales por moneda
    ventas_bob = ventas.filter(moneda='BOB')
    ventas_usd = ventas.filter(moneda='USD')
    
    total_monto_bob = ventas_bob.aggregate(total=Sum('total'))['total'] or 0
    total_monto_usd = ventas_usd.aggregate(total=Sum('total'))['total'] or 0
    
    # Calcular totales por tipo de pago
    ventas_contado = ventas.filter(tipo_pago='contado').count()
    ventas_credito = ventas.filter(tipo_pago='credito').count()
    
    # Calcular totales por estado
    ventas_completadas = ventas.filter(estado='completada').count()
    ventas_pendientes = ventas.filter(estado='pendiente').count()
    ventas_canceladas = ventas.filter(estado='cancelada').count()
    ventas_anuladas = ventas.filter(estado='anulada').count()
    
    # Obtener datos para los selectores
    vendedores = User.objects.filter(ventas__isnull=False).distinct().order_by('first_name', 'username')
    
    # Contar filtros activos
    filtros_activos = sum([
        bool(buscar),
        bool(fecha_desde),
        bool(fecha_hasta),
        bool(estado),
        bool(tipo_pago),
        bool(metodo_pago),
        bool(vendedor_id),
        bool(moneda),
        bool(monto_minimo),
        bool(monto_maximo),
    ])
    
    # Configurar paginación (10 items por página)
    paginator = Paginator(ventas, 10)
    page = request.GET.get('page', 1)
    
    try:
        ventas_paginadas = paginator.page(page)
    except PageNotAnInteger:
        ventas_paginadas = paginator.page(1)
    except EmptyPage:
        ventas_paginadas = paginator.page(paginator.num_pages)

    query_params = request.GET.copy()
    query_params.pop('page', None)
    querystring = query_params.urlencode()
    
    context = {
        'ventas': ventas_paginadas,
        'vendedores': vendedores,
        'total_ventas': total_ventas,
        'total_monto_bob': total_monto_bob,
        'total_monto_usd': total_monto_usd,
        'ventas_contado': ventas_contado,
        'ventas_credito': ventas_credito,
        'ventas_completadas': ventas_completadas,
        'ventas_pendientes': ventas_pendientes,
        'ventas_canceladas': ventas_canceladas,
        'ventas_anuladas': ventas_anuladas,
        'filtros_activos': filtros_activos,
        # Mantener valores de filtros
        'buscar': buscar,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'estado': estado,
        'tipo_pago': tipo_pago,
        'metodo_pago': metodo_pago,
        'vendedor_id': vendedor_id,
        'moneda': moneda,
        'monto_minimo': monto_minimo,
        'monto_maximo': monto_maximo,
        'ordenar_por': ordenar_por,
        'querystring': querystring,
    }
    
    return render(request, 'reportes/ventas/ventas.html', context)


def _queryset_reporte_ventas_filtrado(request):
    """Reutiliza la misma lógica de filtros del reporte de ventas."""
    ventas = Venta.objects.select_related(
        'ubicacion', 'vendedor'
    ).prefetch_related('detalles')

    buscar = request.GET.get('buscar', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    estado = request.GET.get('estado', '').strip()
    tipo_pago = request.GET.get('tipo_pago', '').strip()
    vendedor_id = request.GET.get('vendedor', '').strip()
    moneda = request.GET.get('moneda', '').strip()
    monto_minimo = request.GET.get('monto_minimo', '').strip()
    monto_maximo = request.GET.get('monto_maximo', '').strip()
    ordenar_por = request.GET.get('ordenar', 'fecha_desc').strip()

    if buscar:
        ventas = ventas.filter(
            Q(codigo__icontains=buscar) |
            Q(cliente__icontains=buscar) |
            Q(razon_social__icontains=buscar) |
            Q(telefono__icontains=buscar)
        )

    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, '%Y-%m-%d')
            ventas = ventas.filter(fecha_elaboracion__gte=fecha_desde_dt)
        except ValueError:
            pass

    if fecha_hasta:
        try:
            from datetime import timedelta
            fecha_hasta_dt = datetime.strptime(fecha_hasta, '%Y-%m-%d')
            fecha_hasta_dt = fecha_hasta_dt + timedelta(days=1) - timedelta(seconds=1)
            ventas = ventas.filter(fecha_elaboracion__lte=fecha_hasta_dt)
        except ValueError:
            pass

    if estado:
        ventas = ventas.filter(estado=estado)

    if tipo_pago:
        ventas = ventas.filter(tipo_pago=tipo_pago)

    if vendedor_id:
        ventas = ventas.filter(vendedor_id=vendedor_id)

    if moneda:
        ventas = ventas.filter(moneda=moneda)

    if monto_minimo:
        try:
            ventas = ventas.filter(total__gte=float(monto_minimo))
        except ValueError:
            pass

    if monto_maximo:
        try:
            ventas = ventas.filter(total__lte=float(monto_maximo))
        except ValueError:
            pass

    if ordenar_por == 'fecha_asc':
        ventas = ventas.order_by('fecha_elaboracion')
    elif ordenar_por == 'codigo':
        ventas = ventas.order_by('codigo')
    elif ordenar_por == 'cliente':
        ventas = ventas.order_by('cliente')
    elif ordenar_por == 'total_desc':
        ventas = ventas.order_by('-total')
    elif ordenar_por == 'total_asc':
        ventas = ventas.order_by('total')
    elif ordenar_por == 'estado':
        ventas = ventas.order_by('estado')
    else:
        ventas = ventas.order_by('-fecha_elaboracion')

    filtros = {
        'buscar': buscar,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'estado': estado,
        'tipo_pago': tipo_pago,
        'vendedor': vendedor_id,
        'moneda': moneda,
        'monto_minimo': monto_minimo,
        'monto_maximo': monto_maximo,
    }
    return ventas, filtros


def _texto_filtros_reporte_ventas(filtros):
    partes = []
    labels = {
        'buscar': 'Buscar',
        'fecha_desde': 'Desde',
        'fecha_hasta': 'Hasta',
        'estado': 'Estado',
        'tipo_pago': 'Tipo pago',
        'moneda': 'Moneda',
        'monto_minimo': 'Monto mín.',
        'monto_maximo': 'Monto máx.',
    }
    for key, label in labels.items():
        val = filtros.get(key)
        if val:
            partes.append(f'{label}: {val}')
    return ' | '.join(partes) if partes else 'Sin filtros adicionales'


@login_required
def reporte_ventas_comision_pdf(request):
    """
    PDF de comisión para un vendedor específico (admin).
    Requiere filtro vendedor seleccionado (un solo usuario).
    """
    vendedor_id = request.GET.get('vendedor', '').strip()
    if not vendedor_id:
        messages.error(
            request,
            'Para generar el reporte de comisión debe seleccionar un vendedor (no "Todos").',
        )
        return redirect('reporte_ventas')

    try:
        vendedor = User.objects.select_related('perfil').get(pk=vendedor_id)
    except (User.DoesNotExist, ValueError, TypeError):
        messages.error(request, 'El vendedor seleccionado no existe.')
        return redirect('reporte_ventas')

    ventas, filtros = _queryset_reporte_ventas_filtrado(request)
    # Asegurar filtro por ese vendedor (por si viene vacío en el helper)
    ventas = ventas.filter(vendedor_id=vendedor.id)
    ventas_list = list(ventas)

    perfil = getattr(vendedor, 'perfil', None)
    porcentaje = getattr(perfil, 'comision', 0) if perfil else 0

    from apps.ventas.pdf_generator import generar_pdf_reporte_comision
    buffer = generar_pdf_reporte_comision(
        usuario=vendedor,
        perfil=perfil,
        ventas=ventas_list,
        filtros_texto=_texto_filtros_reporte_ventas(filtros),
        porcentaje_comision=porcentaje,
    )

    nombre = f'Comision_{vendedor.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{nombre}"'
    return response


@login_required
def reporte_traspasos(request):
    """Vista para reporte de traspasos entre ubicaciones"""
    from apps.traspasos.models import Traspaso, DetalleTraspaso
    
    # Obtener todos los traspasos con sus relaciones
    traspasos = Traspaso.objects.select_related(
        'origen', 'destino', 'creado_por', 'aceptado_por'
    ).prefetch_related('detalles').all()
    
    # Obtener filtros de la petición
    buscar = request.GET.get('buscar', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    estado = request.GET.get('estado', '').strip()
    tipo = request.GET.get('tipo', '').strip()
    origen_id = request.GET.get('origen', '').strip()
    destino_id = request.GET.get('destino', '').strip()
    creado_por_id = request.GET.get('creado_por', '').strip()
    ordenar_por = request.GET.get('ordenar', 'fecha_desc').strip()
    
    # Aplicar filtros
    if buscar:
        traspasos = traspasos.filter(
            Q(codigo__icontains=buscar) |
            Q(comentario__icontains=buscar) |
            Q(origen__nombre_ubicacion__icontains=buscar) |
            Q(destino__nombre_ubicacion__icontains=buscar)
        )
    
    if fecha_desde:
        traspasos = traspasos.filter(fecha_creacion__gte=fecha_desde)
    
    if fecha_hasta:
        # Incluir todo el día hasta las 23:59:59
        from datetime import datetime, timedelta
        fecha_hasta_obj = datetime.strptime(fecha_hasta, '%Y-%m-%d')
        fecha_hasta_final = fecha_hasta_obj + timedelta(days=1)
        traspasos = traspasos.filter(fecha_creacion__lt=fecha_hasta_final)
    
    if estado:
        traspasos = traspasos.filter(estado=estado)
    
    if tipo:
        traspasos = traspasos.filter(tipo=tipo)
    
    if origen_id:
        traspasos = traspasos.filter(origen_id=origen_id)
    
    if destino_id:
        traspasos = traspasos.filter(destino_id=destino_id)
    
    if creado_por_id:
        traspasos = traspasos.filter(creado_por_id=creado_por_id)
    
    # Aplicar ordenamiento
    if ordenar_por == 'fecha_desc':
        traspasos = traspasos.order_by('-fecha_creacion')
    elif ordenar_por == 'fecha_asc':
        traspasos = traspasos.order_by('fecha_creacion')
    elif ordenar_por == 'codigo':
        traspasos = traspasos.order_by('codigo')
    elif ordenar_por == 'estado':
        traspasos = traspasos.order_by('estado')
    elif ordenar_por == 'tipo':
        traspasos = traspasos.order_by('tipo')
    
    # Calcular estadísticas antes de paginar
    total_traspasos = traspasos.count()
    
    # Calcular totales por estado
    traspasos_pendientes = traspasos.filter(estado='pendiente').count()
    traspasos_transito = traspasos.filter(estado='transito').count()
    traspasos_recibidos = traspasos.filter(estado='recibido').count()
    traspasos_rechazados = traspasos.filter(estado='rechazado').count()
    traspasos_cancelados = traspasos.filter(estado='cancelado').count()
    
    # Calcular totales por tipo
    traspasos_normales = traspasos.filter(tipo='normal').count()
    traspasos_devolucion = traspasos.filter(tipo='devolucion').count()
    
    # Obtener datos para los selectores
    ubicaciones_origen = PerfilUsuario.objects.filter(
        traspasos_enviados__isnull=False
    ).distinct().order_by('nombre_ubicacion')
    
    ubicaciones_destino = PerfilUsuario.objects.filter(
        traspasos_recibidos__isnull=False
    ).distinct().order_by('nombre_ubicacion')
    
    usuarios_creadores = User.objects.filter(
        traspasos_creados__isnull=False
    ).distinct().order_by('first_name', 'username')
    
    # Contar filtros activos
    filtros_activos = sum([
        bool(buscar),
        bool(fecha_desde),
        bool(fecha_hasta),
        bool(estado),
        bool(tipo),
        bool(origen_id),
        bool(destino_id),
        bool(creado_por_id),
    ])
    
    # Configurar paginación (10 items por página)
    paginator = Paginator(traspasos, 10)
    page = request.GET.get('page', 1)
    
    try:
        traspasos_paginados = paginator.page(page)
    except PageNotAnInteger:
        traspasos_paginados = paginator.page(1)
    except EmptyPage:
        traspasos_paginados = paginator.page(paginator.num_pages)

    query_params = request.GET.copy()
    query_params.pop('page', None)
    querystring = query_params.urlencode()
    
    context = {
        'traspasos': traspasos_paginados,
        'ubicaciones_origen': ubicaciones_origen,
        'ubicaciones_destino': ubicaciones_destino,
        'usuarios_creadores': usuarios_creadores,
        'total_traspasos': total_traspasos,
        'traspasos_pendientes': traspasos_pendientes,
        'traspasos_transito': traspasos_transito,
        'traspasos_recibidos': traspasos_recibidos,
        'traspasos_rechazados': traspasos_rechazados,
        'traspasos_cancelados': traspasos_cancelados,
        'traspasos_normales': traspasos_normales,
        'traspasos_devolucion': traspasos_devolucion,
        'filtros_activos': filtros_activos,
        # Mantener valores de filtros
        'buscar': buscar,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'estado': estado,
        'tipo': tipo,
        'origen_id': origen_id,
        'destino_id': destino_id,
        'creado_por_id': creado_por_id,
        'ordenar_por': ordenar_por,
        'querystring': querystring,
    }
    
    return render(request, 'reportes/traspasos/traspasos.html', context)

@login_required
def reporte_contenedores(request):
    """Vista para reporte de contenedores y productos"""
    
    # Obtener todos los productos con sus relaciones en contenedores
    productos_contenedores = ProductoContenedor.objects.select_related(
        'producto', 'producto__categoria', 'contenedor'
    ).all()
    
    # Obtener filtros de la petición
    buscar = request.GET.get('buscar', '').strip()
    contenedor_id = request.GET.get('contenedor', '').strip()
    categoria_id = request.GET.get('categoria', '').strip()
    proveedor = request.GET.get('proveedor', '').strip()
    estado = request.GET.get('estado', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    ordenar_por = request.GET.get('ordenar', 'producto').strip()
    stock_minimo = request.GET.get('stock_minimo', '').strip()
    
    # Aplicar filtros
    if buscar:
        productos_contenedores = productos_contenedores.filter(
            Q(producto__nombre__icontains=buscar) |
            Q(producto__codigo__icontains=buscar) |
            Q(contenedor__nombre__icontains=buscar) |
            Q(contenedor__proveedor__icontains=buscar)
        )
    
    if contenedor_id:
        productos_contenedores = productos_contenedores.filter(contenedor_id=contenedor_id)
    
    if categoria_id:
        productos_contenedores = productos_contenedores.filter(producto__categoria_id=categoria_id)
    
    if proveedor:
        productos_contenedores = productos_contenedores.filter(contenedor__proveedor__icontains=proveedor)
    
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, '%Y-%m-%d')
            productos_contenedores = productos_contenedores.filter(fecha_creacion__gte=fecha_desde_dt)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.strptime(fecha_hasta, '%Y-%m-%d')
            productos_contenedores = productos_contenedores.filter(fecha_creacion__lte=fecha_hasta_dt)
        except ValueError:
            pass
    
    if stock_minimo:
        try:
            stock_min = int(stock_minimo)
            productos_contenedores = productos_contenedores.filter(cantidad__gte=stock_min)
        except ValueError:
            pass
    
    # Aplicar ordenamiento
    if ordenar_por == 'producto':
        productos_contenedores = productos_contenedores.order_by('producto__nombre')
    elif ordenar_por == 'codigo':
        productos_contenedores = productos_contenedores.order_by('producto__codigo')
    elif ordenar_por == 'contenedor':
        productos_contenedores = productos_contenedores.order_by('contenedor__nombre')
    elif ordenar_por == 'proveedor':
        productos_contenedores = productos_contenedores.order_by('contenedor__proveedor')
    elif ordenar_por == 'stock_desc':
        productos_contenedores = productos_contenedores.order_by('-cantidad')
    elif ordenar_por == 'stock_asc':
        productos_contenedores = productos_contenedores.order_by('cantidad')
    elif ordenar_por == 'fecha_desc':
        productos_contenedores = productos_contenedores.order_by('-fecha_actualizacion')
    elif ordenar_por == 'fecha_asc':
        productos_contenedores = productos_contenedores.order_by('fecha_actualizacion')
    
    # Preparar datos con estado de stock
    items_reporte = []
    for pc in productos_contenedores:
        producto = pc.producto
        
        # Determinar estado de stock
        if producto.stock_critico and pc.cantidad <= producto.stock_critico:
            estado_stock = 'critico'
        elif producto.stock_bajo and pc.cantidad <= producto.stock_bajo:
            estado_stock = 'bajo'
        else:
            estado_stock = 'normal'
        
        # Filtrar por estado si está seleccionado
        if estado and estado_stock != estado:
            continue
        
        items_reporte.append({
            'producto': producto,
            'contenedor': pc.contenedor,
            'cantidad': pc.cantidad,
            'cantidad_recibida': pc.cantidad_recibida,
            'estado': estado_stock,
            'fecha_actualizacion': pc.fecha_actualizacion,
        })
    
    # Obtener todos los contenedores y categorías para los filtros
    contenedores = Contenedor.objects.filter(activo=True).order_by('nombre')
    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    proveedores = Contenedor.objects.filter(activo=True).values_list('proveedor', flat=True).distinct().order_by('proveedor')
    
    # Calcular totales
    total_items = len(items_reporte)
    total_unidades = sum(item['cantidad'] for item in items_reporte)
    total_contenedores = contenedores.count()
    
    # Contar filtros activos
    filtros_activos = sum([
        bool(buscar),
        bool(contenedor_id),
        bool(categoria_id),
        bool(proveedor),
        bool(estado),
        bool(fecha_desde),
        bool(fecha_hasta),
        bool(stock_minimo),
    ])
    
    # Configurar paginación (10 items por página)
    paginator = Paginator(items_reporte, 10)
    page = request.GET.get('page', 1)
    
    try:
        items_paginados = paginator.page(page)
    except PageNotAnInteger:
        items_paginados = paginator.page(1)
    except EmptyPage:
        items_paginados = paginator.page(paginator.num_pages)

    query_params = request.GET.copy()
    query_params.pop('page', None)
    querystring = query_params.urlencode()
    
    context = {
        'items_reporte': items_paginados,
        'contenedores': contenedores,
        'categorias': categorias,
        'proveedores': proveedores,
        'total_items': total_items,
        'total_unidades': total_unidades,
        'total_contenedores': total_contenedores,
        'filtros_activos': filtros_activos,
        # Mantener valores de filtros
        'buscar': buscar,
        'contenedor_id': contenedor_id,
        'categoria_id': categoria_id,
        'proveedor': proveedor,
        'estado': estado,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'ordenar_por': ordenar_por,
        'stock_minimo': stock_minimo,
        'querystring': querystring,
    }
    
    return render(request, 'reportes/contenedores/contenedores.html', context)


@login_required
def reporte_ventas_productos(request):
    """Vista para reporte de ventas por producto con análisis de utilidad"""
    from django.db.models import F, ExpressionWrapper, DecimalField, Sum, Count

    detalles = DetalleVenta.objects.select_related(
        'producto', 'producto__categoria', 'venta', 'venta__ubicacion', 'venta__vendedor'
    ).filter(venta__estado__in=['completada', 'pendiente'])

    buscar = request.GET.get('buscar', '').strip()
    fecha_desde = request.GET.get('fecha_desde', '').strip()
    fecha_hasta = request.GET.get('fecha_hasta', '').strip()
    categoria_id = request.GET.get('categoria', '').strip()
    genero = request.GET.get('genero', '').strip()
    estado_venta = request.GET.get('estado_venta', '').strip()
    ubicacion_id = request.GET.get('ubicacion', '').strip()
    ordenar_por = request.GET.get('ordenar', 'utilidad_desc').strip()
    utilidad_minima = request.GET.get('utilidad_minima', '').strip()
    ventas_minimas = request.GET.get('ventas_minimas', '').strip()

    if buscar:
        detalles = detalles.filter(
            Q(producto__nombre__icontains=buscar) |
            Q(producto__codigo__icontains=buscar)
        )

    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, '%Y-%m-%d')
            detalles = detalles.filter(venta__fecha_elaboracion__gte=fecha_desde_dt)
        except ValueError:
            pass

    if fecha_hasta:
        try:
            from datetime import timedelta
            fecha_hasta_dt = datetime.strptime(fecha_hasta, '%Y-%m-%d')
            fecha_hasta_dt = fecha_hasta_dt + timedelta(days=1) - timedelta(seconds=1)
            detalles = detalles.filter(venta__fecha_elaboracion__lte=fecha_hasta_dt)
        except ValueError:
            pass

    if categoria_id:
        detalles = detalles.filter(producto__categoria_id=categoria_id)

    if genero:
        detalles = detalles.filter(producto__genero=genero)

    if estado_venta:
        detalles = detalles.filter(venta__estado=estado_venta)

    if ubicacion_id:
        detalles = detalles.filter(venta__ubicacion_id=ubicacion_id)

    productos_agrupados = {}
    for dv in detalles:
        pid = dv.producto.id
        if pid not in productos_agrupados:
            productos_agrupados[pid] = {
                'producto': dv.producto,
                'cantidad_total': 0,
                'cajas_total': 0,
                'ventas_total': Decimal('0'),
                'precio_compra_unit': dv.producto.precio_compra,
                'num_ventas': 0,
                'ubicaciones': set(),
                'modalidades': {},
            }
        p = productos_agrupados[pid]
        p['cantidad_total'] += dv.cantidad
        p['cajas_total'] += dv.cantidad_cajas or 0
        p['ventas_total'] += dv.subtotal
        p['num_ventas'] += 1
        if dv.venta.ubicacion_id:
            p['ubicaciones'].add(dv.venta.ubicacion.nombre_ubicacion)
        mod_key = dv.get_modalidad_display()
        p['modalidades'][mod_key] = p['modalidades'].get(mod_key, 0) + dv.cantidad

    items_reporte = []
    for pid, data in productos_agrupados.items():
        prod = data['producto']
        costo_total = Decimal(prod.precio_compra) * Decimal(data['cantidad_total'])
        utilidad = data['ventas_total'] - costo_total
        if data['ventas_total'] > 0:
            margen = (utilidad / data['ventas_total']) * Decimal('100')
        else:
            margen = Decimal('0')
        precio_promedio = data['ventas_total'] / Decimal(data['cantidad_total']) if data['cantidad_total'] > 0 else Decimal('0')
        items_reporte.append({
            'producto': prod,
            'cantidad_total': data['cantidad_total'],
            'cajas_total': data['cajas_total'],
            'costo_total': costo_total,
            'ventas_total': data['ventas_total'],
            'utilidad': utilidad,
            'margen': margen,
            'precio_promedio': precio_promedio,
            'num_ventas': data['num_ventas'],
            'ubicaciones': sorted(data['ubicaciones']),
            'modalidades': data['modalidades'],
        })

    if utilidad_minima:
        try:
            umin = float(utilidad_minima)
            items_reporte = [i for i in items_reporte if float(i['utilidad']) >= umin]
        except ValueError:
            pass

    if ventas_minimas:
        try:
            vmin = float(ventas_minimas)
            items_reporte = [i for i in items_reporte if float(i['ventas_total']) >= vmin]
        except ValueError:
            pass

    if ordenar_por == 'nombre':
        items_reporte.sort(key=lambda x: x['producto'].nombre)
    elif ordenar_por == 'codigo':
        items_reporte.sort(key=lambda x: x['producto'].codigo)
    elif ordenar_por == 'cantidad_desc':
        items_reporte.sort(key=lambda x: x['cantidad_total'], reverse=True)
    elif ordenar_por == 'cantidad_asc':
        items_reporte.sort(key=lambda x: x['cantidad_total'])
    elif ordenar_por == 'ventas_desc':
        items_reporte.sort(key=lambda x: x['ventas_total'], reverse=True)
    elif ordenar_por == 'ventas_asc':
        items_reporte.sort(key=lambda x: x['ventas_total'])
    elif ordenar_por == 'utilidad_asc':
        items_reporte.sort(key=lambda x: x['utilidad'])
    elif ordenar_por == 'margen_desc':
        items_reporte.sort(key=lambda x: x['margen'], reverse=True)
    elif ordenar_por == 'margen_asc':
        items_reporte.sort(key=lambda x: x['margen'])
    else:
        items_reporte.sort(key=lambda x: x['utilidad'], reverse=True)

    total_cantidad = sum(i['cantidad_total'] for i in items_reporte)
    total_cajas = sum(i['cajas_total'] for i in items_reporte)
    total_costo = sum(i['costo_total'] for i in items_reporte)
    total_ventas_monto = sum(i['ventas_total'] for i in items_reporte)
    total_utilidad = sum(i['utilidad'] for i in items_reporte)
    total_productos = len(items_reporte)
    total_num_ventas = sum(i['num_ventas'] for i in items_reporte)
    margen_global = (total_utilidad / total_ventas_monto * Decimal('100')) if total_ventas_monto > 0 else Decimal('0')

    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    ubicaciones = PerfilUsuario.objects.filter(
        id__in=Venta.objects.values_list('ubicacion_id', flat=True).distinct()
    ).order_by('nombre_ubicacion')

    filtros_activos = sum([
        bool(buscar),
        bool(fecha_desde),
        bool(fecha_hasta),
        bool(categoria_id),
        bool(genero),
        bool(estado_venta),
        bool(ubicacion_id),
        bool(utilidad_minima),
        bool(ventas_minimas),
    ])

    paginator = Paginator(items_reporte, 10)
    page = request.GET.get('page', 1)

    try:
        items_paginados = paginator.page(page)
    except PageNotAnInteger:
        items_paginados = paginator.page(1)
    except EmptyPage:
        items_paginados = paginator.page(paginator.num_pages)

    query_params = request.GET.copy()
    query_params.pop('page', None)
    querystring = query_params.urlencode()

    context = {
        'items_reporte': items_paginados,
        'categorias': categorias,
        'ubicaciones': ubicaciones,
        'total_productos': total_productos,
        'total_cantidad': total_cantidad,
        'total_cajas': total_cajas,
        'total_costo': total_costo,
        'total_ventas_monto': total_ventas_monto,
        'total_utilidad': total_utilidad,
        'total_num_ventas': total_num_ventas,
        'margen_global': margen_global,
        'filtros_activos': filtros_activos,
        'buscar': buscar,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'categoria_id': categoria_id,
        'genero': genero,
        'estado_venta': estado_venta,
        'ubicacion_id': ubicacion_id,
        'ordenar_por': ordenar_por,
        'utilidad_minima': utilidad_minima,
        'ventas_minimas': ventas_minimas,
        'querystring': querystring,
        'GENERO_CHOICES': Producto.GENERO_CHOICES,
    }

    return render(request, 'reportes/reportesproductosventas/reportesproductosventas.html', context)
