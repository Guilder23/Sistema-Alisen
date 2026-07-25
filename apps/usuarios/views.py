from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.contrib import messages
from django.contrib.auth.models import User
from django.db.models import Q, Sum, F
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.paginator import Paginator
from decimal import Decimal
from apps.productos.models import Categoria, Producto
from .models import PerfilUsuario


def _es_usuario_tecnico_deposito(usuario):
    return usuario.username.startswith('deposito_auto_')

def index(request):
    """Página de inicio pública con catálogo de productos (máx. 4 productos)"""
    if request.user.is_authenticated:
        return redirect('dashboard')

    buscar = request.GET.get('buscar', '').strip()
    categoria_id = request.GET.get('categoria', '').strip()

    productos = Producto.objects.select_related('categoria').filter(activo=True, publicado=True)
    if buscar:
        productos = productos.filter(
            Q(codigo__icontains=buscar) |
            Q(nombre__icontains=buscar) |
            Q(descripcion__icontains=buscar) |
            Q(categoria__nombre__icontains=buscar)
        )

    if categoria_id:
        productos = productos.filter(categoria_id=categoria_id)

    productos = productos.order_by('-fecha_creacion')[:4]
    categorias = Categoria.objects.filter(activo=True).order_by('nombre')

    context = {
        'productos': productos,
        'categorias': categorias,
        'buscar': buscar,
        'categoria': categoria_id,
        'tienda_nombre': 'Alicen Imports',
        'tienda_descripcion': 'Importamos calidad para toda Bolivia con envíos seguros y atención personalizada.',
        'tienda_telefono': '+59170000000',
        'tienda_whatsapp': '+59170000000',
        'tienda_email': 'contacto@alicen.com',
        'tienda_direccion': 'La Paz, Bolivia',
    }
    return render(request, 'inicio/index.html', context)


def tienda(request):
    """Página de Tienda con todos los productos publicados y filtros"""
    if request.user.is_authenticated:
        pass  # Permitir también a usuarios autenticados

    buscar = request.GET.get('buscar', '').strip()
    categoria_id = request.GET.get('categoria', '').strip()
    genero = request.GET.get('genero', '').strip()
    precio_min = request.GET.get('precio_min', '').strip()
    precio_max = request.GET.get('precio_max', '').strip()
    orden = request.GET.get('orden', '').strip()

    productos = Producto.objects.select_related('categoria').filter(activo=True, publicado=True)
    if buscar:
        productos = productos.filter(
            Q(codigo__icontains=buscar) |
            Q(nombre__icontains=buscar) |
            Q(descripcion__icontains=buscar) |
            Q(categoria__nombre__icontains=buscar)
        )

    if categoria_id:
        productos = productos.filter(categoria_id=categoria_id)

    if genero:
        productos = productos.filter(genero=genero)

    from decimal import Decimal
    if precio_min:
        try:
            productos = productos.filter(precio_caja__gte=Decimal(precio_min))
        except Exception:
            pass
    if precio_max:
        try:
            productos = productos.filter(precio_caja__lte=Decimal(precio_max))
        except Exception:
            pass

    if orden == 'precio_asc':
        productos = productos.order_by('precio_caja')
    elif orden == 'precio_desc':
        productos = productos.order_by('-precio_caja')
    elif orden == 'nombre':
        productos = productos.order_by('nombre')
    else:
        productos = productos.order_by('-fecha_creacion')

    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    genero_choices = Producto.GENERO_CHOICES

    context = {
        'productos': productos,
        'categorias': categorias,
        'genero_choices': genero_choices,
        'buscar': buscar,
        'categoria': categoria_id,
        'genero': genero,
        'precio_min': precio_min,
        'precio_max': precio_max,
        'orden': orden,
        'tienda_nombre': 'Alicen Imports',
        'tienda_descripcion': 'Importamos calidad para toda Bolivia con envíos seguros y atención personalizada.',
        'tienda_telefono': '+59170000000',
        'tienda_whatsapp': '+59170000000',
        'tienda_email': 'contacto@alicen.com',
        'tienda_direccion': 'La Paz, Bolivia',
    }
    return render(request, 'inicio/tienda.html', context)


def product_detail(request, id):
    """Página pública: detalle de producto para la tienda virtual"""
    from apps.inventario.models import Inventario
    from apps.depositos.models import Deposito as DepositoModel
    producto = get_object_or_404(Producto, id=id, activo=True, publicado=True)
    buscar = request.GET.get('buscar', '').strip()
    categoria = request.GET.get('categoria', '').strip()
    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    similares = Producto.objects.filter(
        activo=True,
        publicado=True,
        categoria=producto.categoria
    ).exclude(id=producto.id).order_by('-fecha_creacion')[:4] if producto.categoria else Producto.objects.none()

    inventarios_ubicacion = Inventario.objects.filter(
        producto=producto,
        cantidad__gt=0
    ).select_related(
        'ubicacion', 'ubicacion__tienda', 'ubicacion__almacen'
    ).order_by('-cantidad')

    ubicaciones_disponibles = []
    almacenes_stock = []
    tiendas_stock = []
    depositos_stock = []
    otros_stock = []

    for inv in inventarios_ubicacion:
        nombre = None
        ciudad = None
        departamento = None
        direccion = None
        tipo = None
        if inv.ubicacion.tienda:
            nombre = inv.ubicacion.tienda.nombre
            ciudad = inv.ubicacion.tienda.ciudad
            departamento = inv.ubicacion.tienda.departamento
            direccion = inv.ubicacion.tienda.direccion
            tipo = 'Tienda'
        elif inv.ubicacion.almacen:
            nombre = inv.ubicacion.almacen.nombre
            ciudad = inv.ubicacion.almacen.ciudad
            departamento = inv.ubicacion.almacen.departamento
            direccion = inv.ubicacion.almacen.direccion
            tipo = 'Almacén'
        elif inv.ubicacion.rol == 'deposito':
            deposito_asociado = DepositoModel.objects.filter(
                nombre=inv.ubicacion.nombre_ubicacion,
                estado='activo'
            ).first()
            if deposito_asociado:
                nombre = deposito_asociado.nombre
                ciudad = deposito_asociado.ciudad
                departamento = deposito_asociado.departamento
                direccion = deposito_asociado.direccion
                tipo = 'Depósito'
            else:
                nombre = inv.ubicacion.nombre_ubicacion
                tipo = 'Depósito'
        else:
            nombre = inv.ubicacion.nombre_ubicacion
            tipo = inv.ubicacion.get_rol_display() if inv.ubicacion.rol else 'Ubicación'

        ubi_data = {
            'nombre': nombre,
            'tipo': tipo,
            'ciudad': ciudad,
            'departamento': departamento,
            'direccion': direccion,
            'cantidad': inv.cantidad,
        }
        ubicaciones_disponibles.append(ubi_data)

        if tipo == 'Almacén':
            almacenes_stock.append(ubi_data)
        elif tipo == 'Tienda':
            tiendas_stock.append(ubi_data)
        elif tipo == 'Depósito':
            depositos_stock.append(ubi_data)
        else:
            otros_stock.append(ubi_data)

    total_almacenes = sum(a['cantidad'] for a in almacenes_stock)
    total_tiendas = sum(t['cantidad'] for t in tiendas_stock)
    total_depositos = sum(d['cantidad'] for d in depositos_stock)
    total_otros = sum(o['cantidad'] for o in otros_stock)

    context = {
        'producto': producto,
        'categorias': categorias,
        'buscar': buscar,
        'categoria': categoria,
        'similares': similares,
        'ubicaciones_disponibles': ubicaciones_disponibles,
        'almacenes_stock': almacenes_stock,
        'tiendas_stock': tiendas_stock,
        'depositos_stock': depositos_stock,
        'otros_stock': otros_stock,
        'total_almacenes': total_almacenes,
        'total_tiendas': total_tiendas,
        'total_depositos': total_depositos,
        'total_otros': total_otros,
        'tienda_nombre': 'Alicen Imports',
        'tienda_descripcion': 'Importamos calidad para toda Bolivia con envíos seguros y atención personalizada.',
        'tienda_telefono': '+59170000000',
        'tienda_whatsapp': '+59170000000',
        'tienda_email': 'contacto@alicen.com',
        'tienda_direccion': 'La Paz, Bolivia',
    }
    return render(request, 'inicio/detalle_producto.html', context)


def carrito(request):
    """Página pública del carrito de compras"""
    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    buscar = request.GET.get('buscar', '').strip()
    categoria = request.GET.get('categoria', '').strip()
    context = {
        'categorias': categorias,
        'buscar': buscar,
        'categoria': categoria,
        'tienda_nombre': 'Alicen Imports',
        'tienda_descripcion': 'Importamos calidad para toda Bolivia con envíos seguros y atención personalizada.',
        'tienda_telefono': '+59170000000',
        'tienda_whatsapp': '+59170000000',
        'tienda_email': 'contacto@alicen.com',
        'tienda_direccion': 'La Paz, Bolivia',
    }
    return render(request, 'inicio/carrito.html', context)


def nosotros(request):
    buscar = request.GET.get('buscar', '').strip()
    categoria = request.GET.get('categoria', '').strip()
    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    context = {
        'categorias': categorias,
        'buscar': buscar,
        'categoria': categoria,
        'tienda_nombre': 'Alicen Imports',
        'tienda_descripcion': 'Importamos calidad para toda Bolivia con envíos seguros y atención personalizada.',
        'tienda_telefono': '+59170000000',
        'tienda_whatsapp': '+59170000000',
        'tienda_email': 'contacto@alicen.com',
        'tienda_direccion': 'La Paz, Bolivia',
    }
    return render(request, 'inicio/nosotros.html', context)


def preguntas_frecuentes(request):
    buscar = request.GET.get('buscar', '').strip()
    categoria = request.GET.get('categoria', '').strip()
    categorias = Categoria.objects.filter(activo=True).order_by('nombre')
    context = {
        'categorias': categorias,
        'buscar': buscar,
        'categoria': categoria,
        'tienda_nombre': 'Alicen Imports',
        'tienda_descripcion': 'Importamos calidad para toda Bolivia con envíos seguros y atención personalizada.',
        'tienda_telefono': '+59170000000',
        'tienda_whatsapp': '+59170000000',
        'tienda_email': 'contacto@alicen.com',
        'tienda_direccion': 'La Paz, Bolivia',
    }
    return render(request, 'inicio/preguntas_frecuentes.html', context)


def custom_logout(request):
    """Cerrar sesión del usuario - acepta GET y POST"""
    logout(request)
    messages.success(request, 'Sesión cerrada exitosamente')
    return redirect('index')

@login_required
def dashboard(request):
    """Dashboard principal del sistema - dinámico por rol"""
    from apps.productos.models import Producto
    from apps.inventario.models import Inventario, MovimientoInventario
    from apps.traspasos.models import Traspaso
    from apps.pedidos.models import Pedido
    from apps.ventas.models import Venta, DetalleVenta
    from apps.vendedores.models import Vendedor
    
    # Determinar qué dashboard mostrar según el rol del usuario
    if request.user.is_superuser:
        template = 'dashboard/admin_dashboard.html'
    elif request.user.is_staff:
        template = 'dashboard/admin_dashboard.html'
    else:
        template = 'dashboard/admin_dashboard.html'
    
    # ======= PRODUCTOS Y STOCK =======
    total_productos = Producto.objects.filter(activo=True).count()
    productos_en_stock = Inventario.objects.filter(cantidad__gt=0).values('producto').distinct().count()
    
    # Stock crítico en TODAS las ubicaciones (almacenes, tiendas, depósitos)
    inventario_critico = Inventario.objects.select_related('producto', 'ubicacion').filter(
        cantidad__lte=F('producto__stock_critico')
    ).count()
    
    inventario_bajo = Inventario.objects.select_related('producto', 'ubicacion').filter(
        cantidad__lte=F('producto__stock_bajo'),
        cantidad__gt=F('producto__stock_critico')
    ).count()
    
    # ======= VENTAS =======
    inicio_mes = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    ventas_mes = Venta.objects.filter(
        fecha_elaboracion__gte=inicio_mes,
        estado='completada'
    )
    total_ventas_mes_bob = ventas_mes.filter(moneda='BOB').aggregate(total=Sum('total'))['total'] or Decimal('0')
    total_ventas_mes_usd = ventas_mes.filter(moneda='USD').aggregate(total=Sum('total'))['total'] or Decimal('0')
    cantidad_ventas_mes = ventas_mes.count()
    
    hoy = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    ventas_hoy = Venta.objects.filter(fecha_elaboracion__gte=hoy, estado='completada').count()
    ventas_pendientes = Venta.objects.filter(estado='pendiente').count()
    
    # ======= TRASPASOS Y PEDIDOS =======
    traspasos_pendientes = Traspaso.objects.filter(estado='PENDIENTE').count()
    pedidos_pendientes = Pedido.objects.filter(estado='PENDIENTE').count()
    
    # ======= MOVIMIENTOS RECIENTES =======
    ultimos_movimientos = MovimientoInventario.objects.select_related(
        'producto', 'ubicacion'
    ).order_by('-fecha')[:5]
    
    # ======= ÚLTIMAS VENTAS =======
    ultimas_ventas = Venta.objects.select_related(
        'ubicacion', 'vendedor'
    ).order_by('-fecha_elaboracion')[:5]
    
    # ======= PRODUCTOS MÁS VENDIDOS DEL MES =======
    productos_mas_vendidos = DetalleVenta.objects.filter(
        venta__fecha_elaboracion__gte=inicio_mes,
        venta__estado='completada'
    ).values(
        'producto__id',
        'producto__codigo',
        'producto__nombre'
    ).annotate(
        total_vendido=Sum('cantidad')
    ).order_by('-total_vendido')[:5]
    
    # ======= STOCK CRÍTICO DETALLADO =======
    # Mostrar productos con stock crítico de TODAS las ubicaciones
    productos_stock_critico = Inventario.objects.select_related(
        'producto', 'ubicacion'
    ).filter(
        cantidad__lte=F('producto__stock_critico')
    ).order_by('cantidad')[:10]
    
    # ======= USUARIOS Y VENDEDORES =======
    # Total usuarios activos del sistema (excluyendo usuarios técnicos de depósitos)
    total_usuarios = User.objects.filter(is_active=True).exclude(username__startswith='deposito_auto_').count()
    # Total vendedores activos desde el módulo de gestión de vendedores
    total_vendedores = Vendedor.objects.filter(estado='activo').count()
    
    context = {
        'total_productos': total_productos,
        'productos_en_stock': productos_en_stock,
        'inventario_critico': inventario_critico,
        'inventario_bajo': inventario_bajo,
        'total_ventas_mes_bob': total_ventas_mes_bob,
        'total_ventas_mes_usd': total_ventas_mes_usd,
        'cantidad_ventas_mes': cantidad_ventas_mes,
        'ventas_hoy': ventas_hoy,
        'ventas_pendientes': ventas_pendientes,
        'traspasos_pendientes': traspasos_pendientes,
        'pedidos_pendientes': pedidos_pendientes,
        'total_usuarios': total_usuarios,
        'total_vendedores': total_vendedores,
        'ultimos_movimientos': ultimos_movimientos,
        'ultimas_ventas': ultimas_ventas,
        'productos_mas_vendidos': productos_mas_vendidos,
        'productos_stock_critico': productos_stock_critico,
    }
    
    return render(request, template, context)

@login_required
def listar_usuarios(request):
    """Listar todos los usuarios con filtros"""
    from apps.almacenes.models import Almacen
    from apps.tiendas.models import Tienda
    
    # Obtener parámetros de búsqueda
    buscar = request.GET.get('buscar', '')
    estado = request.GET.get('estado', '')
    rol = request.GET.get('rol', '')
    
    # Query base - incluir perfil con select_related para optimización
    usuarios = User.objects.select_related('perfil').exclude(username__startswith='deposito_auto_').order_by('-date_joined')
    
    # Aplicar filtros
    if buscar:
        usuarios = usuarios.filter(
            Q(username__icontains=buscar) |
            Q(first_name__icontains=buscar) |
            Q(last_name__icontains=buscar) |
            Q(email__icontains=buscar)
        )
    
    if estado == 'activo':
        usuarios = usuarios.filter(is_active=True)
    elif estado == 'inactivo':
        usuarios = usuarios.filter(is_active=False)
    
    if rol:
        usuarios = usuarios.filter(perfil__rol=rol)
    
    paginator = Paginator(usuarios, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    query_params = request.GET.copy()
    query_params.pop('page', None)

    context = {
        'usuarios': page_obj,
        'buscar': buscar,
        'estado': estado,
        'rol': rol,
        'almacenes': Almacen.objects.filter(estado='activo'),
        'tiendas': Tienda.objects.filter(estado='activo'),
        'page_obj': page_obj,
        'paginator': paginator,
        'is_paginated': page_obj.has_other_pages(),
        'querystring': query_params.urlencode(),
    }
    
    return render(request, 'usuarios/usuarios.html', context)

@login_required
@require_http_methods(["GET", "POST"])
def crear_usuario(request):
    """Crear nuevo usuario"""
    if request.method == 'POST':
        try:
            # Obtener datos del formulario
            username = request.POST.get('username')
            email = request.POST.get('email')
            first_name = request.POST.get('first_name', '')
            last_name = request.POST.get('last_name', '')
            password = request.POST.get('password')
            password2 = request.POST.get('password2')
            is_active = request.POST.get('is_active') == 'on'
            
            # Datos del perfil
            rol = request.POST.get('rol')
            almacen_id = request.POST.get('almacen', '')
            tienda_id = request.POST.get('tienda', '')
            
            # Validar contraseñas
            if password != password2:
                messages.error(request, 'Las contraseñas no coinciden')
                return redirect('listar_usuarios')
            
            if len(password) < 8:
                messages.error(request, 'La contraseña debe tener al menos 8 caracteres')
                return redirect('listar_usuarios')
            
            # Validar que el usuario no exista
            if User.objects.filter(username=username).exists():
                messages.error(request, f'El usuario "{username}" ya existe')
                return redirect('listar_usuarios')
            
            # Validar email único
            if email and User.objects.filter(email=email).exists():
                messages.error(request, f'El correo "{email}" ya está registrado')
                return redirect('listar_usuarios')
            
            # Validar rol
            if not rol:
                messages.error(request, 'Debe seleccionar un rol')
                return redirect('listar_usuarios')
            
            # Validar que almacén sea requerido para Personal de Almacén
            if rol == 'almacen' and not almacen_id:
                messages.error(request, 'Debe seleccionar un almacén para este rol')
                return redirect('listar_usuarios')
            
            # Validar que tienda sea requerida para Personal de Tienda/Depósito
            if rol in ['tienda', 'deposito'] and not tienda_id:
                messages.error(request, 'Debe seleccionar una tienda para este rol')
                return redirect('listar_usuarios')
            
            # Crear usuario
            usuario = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=is_active,
                is_staff=(rol == 'administrador'),
                is_superuser=(rol == 'administrador')
            )
            
            # Obtener almacén y tienda si aplica
            almacen = None
            tienda = None
            
            if almacen_id:
                from apps.almacenes.models import Almacen
                almacen = Almacen.objects.filter(id=almacen_id).first()
            
            if tienda_id:
                from apps.tiendas.models import Tienda
                tienda = Tienda.objects.filter(id=tienda_id).first()
            
            # Crear perfil de usuario
            nombre_ubicacion = ''
            if almacen:
                nombre_ubicacion = almacen.nombre
            elif tienda:
                nombre_ubicacion = tienda.nombre
            
            PerfilUsuario.objects.create(
                usuario=usuario,
                rol=rol,
                nombre_ubicacion=nombre_ubicacion,
                almacen=almacen,
                tienda=tienda,
                activo=is_active,
                creado_por=request.user
            )
            
            messages.success(request, f'Usuario "{username}" creado exitosamente con rol de {dict(PerfilUsuario.ROLES)[rol]}')
            return redirect('listar_usuarios')
            
        except Exception as e:
            messages.error(request, f'Error al crear usuario: {str(e)}')
            return redirect('listar_usuarios')
    
    return redirect('listar_usuarios')

@login_required
def obtener_usuario(request, id):
    """Obtener datos de un usuario en formato JSON"""
    try:
        usuario = get_object_or_404(User, id=id)
        if _es_usuario_tecnico_deposito(usuario):
            return JsonResponse({'error': 'Usuario no disponible en esta vista'}, status=404)
        perfil = usuario.perfil if hasattr(usuario, 'perfil') else None
        
        # Obtener creador
        creado_por_str = ''
        if perfil and perfil.creado_por:
            creado_por_str = f"{perfil.creado_por.first_name} {perfil.creado_por.last_name}".strip()
            if not creado_por_str:
                creado_por_str = perfil.creado_por.username
        
        # Obtener nombre completo
        nombre_completo = f"{usuario.first_name} {usuario.last_name}".strip()
        if not nombre_completo:
            nombre_completo = usuario.username
        
        # Obtener rol display
        rol_display = ''
        if perfil:
            rol_dict = {
                'administrador': 'Administrador',
                'almacen': 'Almacén',
                'tienda': 'Tienda',
                'deposito': 'Depósito',
                'tienda_online': 'Tienda Virtual',
            }
            rol_display = rol_dict.get(perfil.rol, perfil.rol)
        
        data = {
            'id': usuario.id,
            'username': usuario.username,
            'email': usuario.email,
            'first_name': usuario.first_name,
            'last_name': usuario.last_name,
            'nombre_completo': nombre_completo,
            'is_active': usuario.is_active,
            'is_staff': usuario.is_staff,
            'rol': perfil.rol if perfil else '',
            'rol_display': rol_display,
            'almacen_id': perfil.almacen_id if perfil and perfil.almacen_id else '',
            'tienda_id': perfil.tienda_id if perfil and perfil.tienda_id else '',
            'almacen_nombre': perfil.almacen.nombre if perfil and perfil.almacen else '',
            'tienda_nombre': perfil.tienda.nombre if perfil and perfil.tienda else '',
            'creado_por': creado_por_str,
            'last_login': usuario.last_login.strftime('%d/%m/%Y %H:%M') if usuario.last_login else 'Nunca',
            'date_joined': usuario.date_joined.strftime('%d/%m/%Y %H:%M'),
        }
        return JsonResponse(data)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=404)

@login_required
@require_http_methods(["GET", "POST"])
def editar_usuario(request, id):
    """Editar usuario existente"""
    usuario = get_object_or_404(User.objects.exclude(username__startswith='deposito_auto_'), id=id)
    
    if request.method == 'POST':
        try:
            # Actualizar datos
            usuario.username = request.POST.get('username', usuario.username)
            usuario.email = request.POST.get('email', usuario.email)
            usuario.first_name = request.POST.get('first_name', '')
            usuario.last_name = request.POST.get('last_name', '')
            usuario.is_active = request.POST.get('is_active') == 'on'
            
            # Actualizar rol
            nuevo_rol = request.POST.get('rol')
            almacen_id = request.POST.get('almacen', '')
            tienda_id = request.POST.get('tienda', '')
            
            if nuevo_rol:
                # Validar que almacén/tienda sean requeridos según el rol
                if nuevo_rol == 'almacen' and not almacen_id:
                    messages.error(request, 'Debe seleccionar un almacén para este rol')
                    return redirect('listar_usuarios')
                
                if nuevo_rol in ['tienda', 'deposito'] and not tienda_id:
                    messages.error(request, 'Debe seleccionar una tienda para este rol')
                    return redirect('listar_usuarios')
                
                # Actualizar permisos según rol
                usuario.is_staff = (nuevo_rol == 'administrador')
                usuario.is_superuser = (nuevo_rol == 'administrador')
                
                # Actualizar perfil si existe, sino crear
                if hasattr(usuario, 'perfil'):
                    usuario.perfil.rol = nuevo_rol
                    
                    # Actualizar almacén/tienda
                    if almacen_id:
                        usuario.perfil.almacen_id = almacen_id
                        usuario.perfil.tienda_id = None  # Limpiar tienda si es almacén
                    elif tienda_id:
                        usuario.perfil.tienda_id = tienda_id
                        usuario.perfil.almacen_id = None  # Limpiar almacén si es tienda
                    else:
                        usuario.perfil.almacen_id = None
                        usuario.perfil.tienda_id = None
                    
                    usuario.perfil.save()
                else:
                    # Obtener las instancias de Almacén y Tienda
                    from apps.almacenes.models import Almacen
                    from apps.tiendas.models import Tienda
                    
                    almacen = Almacen.objects.filter(id=almacen_id).first() if almacen_id else None
                    tienda = Tienda.objects.filter(id=tienda_id).first() if tienda_id else None
                    
                    PerfilUsuario.objects.create(
                        usuario=usuario,
                        rol=nuevo_rol,
                        nombre_ubicacion=almacen.nombre or tienda.nombre or '',
                        almacen=almacen,
                        tienda=tienda,
                        activo=usuario.is_active,
                        creado_por=request.user
                    )
            
            # Actualizar contraseña solo si se proporciona
            nueva_password = request.POST.get('password')
            if nueva_password:
                usuario.set_password(nueva_password)
            
            usuario.save()
            
            messages.success(request, f'Usuario "{usuario.username}" actualizado exitosamente')
            return redirect('listar_usuarios')
            
        except Exception as e:
            messages.error(request, f'Error al actualizar usuario: {str(e)}')
            return redirect('listar_usuarios')
    
    # Si es GET, retornar datos del usuario en JSON
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        perfil = usuario.perfil if hasattr(usuario, 'perfil') else None
        
        creado_por_str = ''
        if perfil and perfil.creado_por:
            creado_por_str = f"{perfil.creado_por.first_name} {perfil.creado_por.last_name}".strip()
            if not creado_por_str:
                creado_por_str = perfil.creado_por.username
        
        data = {
            'id': usuario.id,
            'username': usuario.username,
            'email': usuario.email,
            'first_name': usuario.first_name,
            'last_name': usuario.last_name,
            'is_active': usuario.is_active,
            'is_staff': usuario.is_staff,
            'rol': perfil.rol if perfil else '',
            'almacen_id': perfil.almacen_id if perfil and perfil.almacen_id else '',
            'tienda_id': perfil.tienda_id if perfil and perfil.tienda_id else '',
            'almacen_nombre': perfil.almacen.nombre if perfil and perfil.almacen else '',
            'tienda_nombre': perfil.tienda.nombre if perfil and perfil.tienda else '',
            'creado_por': creado_por_str,
            'last_login': usuario.last_login.strftime('%d/%m/%Y %H:%M') if usuario.last_login else 'Nunca',
            'date_joined': usuario.date_joined.strftime('%d/%m/%Y %H:%M'),
        }
        return JsonResponse(data)
    
    return redirect('listar_usuarios')


@login_required
def obtener_ubicacion_usuario(request):
    """API endpoint que devuelve la ubicación (almacén o tienda) del usuario actual"""
    try:
        if hasattr(request.user, 'perfil'):
            perfil = request.user.perfil
            data = {
                'id': perfil.id,
                'nombre': perfil.nombre,
                'rol': perfil.rol,
            }
            return JsonResponse(data)
        else:
            return JsonResponse({'error': 'Usuario sin perfil'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_http_methods(["POST"])
def bloquear_usuario(request, id):
    """Bloquear/desbloquear usuario"""
    usuario = get_object_or_404(User.objects.exclude(username__startswith='deposito_auto_'), id=id)
    
    try:
        # Cambiar estado
        usuario.is_active = not usuario.is_active
        usuario.save()
        
        estado = 'activado' if usuario.is_active else 'bloqueado'
        messages.success(request, f'Usuario "{usuario.username}" {estado} correctamente')
        
    except Exception as e:
        messages.error(request, f'Error al cambiar estado del usuario: {str(e)}')
    
    return redirect('listar_usuarios')
