// ================================================================
// MODAL VER PRODUCTO
// ================================================================

(function() {
    'use strict';
    
    window.inicializarModalVer = function() {
        // Manejar clic en botón ver
        $(document).on('click', '.btn-ver-producto', function() {
            const productoId = $(this).data('producto-id');
            const ubicacionId = $(this).data('ubicacion-id');
            cargarProducto(productoId, ubicacionId);
        });
        
        console.log('✓ Modal Ver Producto inicializado');
    };
    
    function cargarProducto(productoId, ubicacionId) {
        const url = ubicacionId
            ? `/productos/${productoId}/obtener/?ubicacion_id=${encodeURIComponent(ubicacionId)}`
            : `/productos/${productoId}/obtener/`;
        
        $.ajax({
            url: url,
            type: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(data) {
                mostrarProducto(data);
            },
            error: function(xhr) {
                alert('Error al cargar los datos del producto');
                console.error(xhr);
            }
        });
    }
    
    function mostrarProducto(data) {
        // Código en badge
        $('#verCodigoDisplay').html(`<span class="codigo-producto-badge">${data.codigo}</span>`);
        
        // Información General
        $('#verNombre').text(data.nombre);
        $('#verCategoria').text(data.categoria_nombre || 'Sin categoría');
        $('#verSubcategoria').text(data.subcategoria_nombre || 'Sin subcategoría');
        $('#verContenedor').text(data.contenedor_nombre || 'Sin contenedor');
        $('#verDescripcion').text(data.descripcion || 'Sin descripción');
        
        // Control de Stock
        $('#verStock').text(data.stock + ' unidades');
        $('#verStockporCaja').text(data.stock_cajas + 'cajas');
        $('#verUnidadesPorCaja').text(data.unidades_por_caja);
        $('#verUnidadesPorMayor').text(data.unidades_por_mayor || 3);

        $('#verStockCritico').text(data.stock_critico);
        $('#verStockBajo').text(data.stock_bajo);

        
        // Precios Bs
        $('#verPrecioUnidad').text('Bs. ' + parseFloat(data.precio_unidad).toFixed(2));
        // Precio unidad oferta: mostrar solo si hay valor positivo
        try {
            const oferta = parseFloat(data.precio_unidad_oferta || 0);
            if (!isNaN(oferta) && oferta > 0) {
                $('#verPrecioUnidadOferta').text('Bs. ' + oferta.toFixed(2));
                $('#infoPrecioUnidadOferta').show();
            } else {
                $('#infoPrecioUnidadOferta').hide();
            }
        } catch (e) {
            $('#infoPrecioUnidadOferta').hide();
        }
        $('#verPrecioCompra').text('Bs. ' + parseFloat(data.precio_compra).toFixed(2));
        $('#verPrecioCaja').text('Bs. ' + parseFloat(data.precio_caja).toFixed(2));
        $('#verPrecioMayor').text('Bs. ' + parseFloat(data.precio_mayor).toFixed(2));
        $('#verPoliza').text('Bs. ' + parseFloat(data.poliza || 0).toFixed(2));
        $('#verGastos').text('Bs. ' + parseFloat(data.gastos || 0).toFixed(2));

    // Función para formatear precios en dólares
    function formatearPrecio(valor) {
        let numero = parseFloat(valor);
        // Si no es un número, devolvemos el texto que prefieras
        return isNaN(numero) ? "$us. 0.00" : "$us. " + numero.toFixed(2);
    }

    // Precios en dólares
    $('#verPrecioUnidadDolar').text(formatearPrecio(data.precio_unidad_dolar));
    $('#verPrecioCompraDolar').text(formatearPrecio(data.precio_compra_dolar));
    $('#verPrecioMayorDolar').text(formatearPrecio(data.precio_mayor_dolar));
    $('#verPrecioCajaDolar').text(formatearPrecio(data.precio_caja_dolar));
        
        // Auditoría
        $('#verCreadoPor').text(data.creado_por || 'No disponible');
        $('#verFechaCreacion').text(data.fecha_creacion || 'No disponible');
        $('#verFechaActualizacion').text(data.fecha_actualizacion || 'No disponible');
        
        // Imagen, galería y video
        window.GaleriaProducto?.renderVer(document.getElementById('modalVerProducto'), data);
        mostrarEstado(data);
        
        // Abrir modal
        $('#modalVerProducto').modal('show');
    }
    
    function mostrarEstado(data) {
        let html = '';
        
        if (data.activo) {
            html += '<span class="estado-producto-activo"><i class="fas fa-check-circle"></i> ACTIVO</span>';
        } else {
            html += '<span class="estado-producto-inactivo"><i class="fas fa-times-circle"></i> INACTIVO</span>';
        }
        
        $('#verEstadoBtn').html(html);
    }
})();
