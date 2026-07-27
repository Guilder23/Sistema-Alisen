// ================================================================
// MODAL EDITAR PRODUCTO - CON NOTIFICACIONES INTEGRADAS
// ================================================================

(function() {
    'use strict';
    
    window.inicializarModalEditar = function() {
        $('#modalEditarProducto').on('shown.bs.modal', function() {
            window.GaleriaProducto?.init(this);
        });

        // Manejar clic en botón editar
        $(document).on('click', '.btn-editar-producto', function() {
            const productoId = $(this).data('producto-id');
            cargarProductoParaEditar(productoId);
        });
        
        // Manejar submit con AJAX
        $(document).on('submit', '#formEditarProducto', function(e) {
            e.preventDefault();
            
            if (!validarFormularioEditar()) {
                return false;
            }
            
            const productoId = $(this).data('producto-id');
            editarProductoAJAX(productoId);
        });
        
        // Limpiar cuando se cierra el modal
        $('#modalEditarProducto').on('hidden.bs.modal', function() {
            limpiarFormularioEditar();
        });
        
        console.log('✓ Modal Editar Producto inicializado');
    };
    
    function cargarProductoParaEditar(productoId) {
        const url = `/productos/${productoId}/obtener/`;
        
        $.ajax({
            url: url,
            type: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(data) {
                llenarFormularioEditar(data, productoId);
            },
            error: function(xhr) {
                mostrarNotificacion('Error al cargar los datos del producto', 'danger');
            }
        });
    }
    
    function llenarFormularioEditar(data, productoId) {
        $('#edit_codigo').val(data.codigo);
        $('#edit_nombre').val(data.nombre);
        $('#edit_categoria').val(data.categoria_id || '');
        $('#edit_descripcion').val(data.descripcion);
        $('#edit_stock').val(data.stock);
        $('#edit_unidades_por_caja').val(data.unidades_por_caja);
        $('#edit_unidades_por_mayor').val(data.unidades_por_mayor || 3);
        $('#edit_stock_critico').val(data.stock_critico);
        $('#edit_stock_bajo').val(data.stock_bajo);
        $('#edit_activo').prop('checked', data.activo);
        
        $('#formEditarProducto').data('producto-id', productoId);
        $('#modalEditarProducto').modal('show');

        window.GaleriaProducto?.loadData('#modalEditarProducto', data);
    }
    
    function editarProductoAJAX(productoId) {
        const form = $('#formEditarProducto')[0];
        const formData = window.GaleriaProducto?.buildFormData(form) || new FormData(form);
        const nombreProducto = $('#edit_nombre').val();
        
        const btnSubmit = $('#formEditarProducto button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm mr-2"></span>Guardando...');
        
        $.ajax({
            url: `/productos/${productoId}/editar/`,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
                btnSubmit.prop('disabled', false).html(textoOriginal);
                $('#modalEditarProducto').modal('hide');
                mostrarNotificacion(
                    `Producto "${nombreProducto}" actualizado exitosamente`,
                    'success',
                    4000
                );
                setTimeout(function() {
                    location.reload();
                }, 1500);
            },
            error: function(xhr) {
                btnSubmit.prop('disabled', false).html(textoOriginal);
                let mensaje = 'Error al actualizar producto';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    mensaje = xhr.responseJSON.error;
                }
                mostrarNotificacion(mensaje, 'danger');
            }
        });
    }
    
    function validarFormularioEditar() {
        const codigo = $('#edit_codigo').val().trim();
        const nombre = $('#edit_nombre').val().trim();
        const categoria = $('#edit_categoria').val();
        const stock = $('#edit_stock').val();
        const unidades_por_caja = $('#edit_unidades_por_caja').val();
        const unidades_por_mayor = $('#edit_unidades_por_mayor').val();
        
        if (!codigo) {
            mostrarNotificacion('El código del producto es requerido', 'warning');
            $('#edit_codigo').focus();
            return false;
        }
        
        if (!nombre) {
            mostrarNotificacion('El nombre del producto es requerido', 'warning');
            $('#edit_nombre').focus();
            return false;
        }

        if (!categoria) {
            mostrarNotificacion('Debe seleccionar una categoría', 'warning');
            $('#edit_categoria').focus();
            return false;
        }
        
        if (!stock || parseInt(stock) < 0) {
            mostrarNotificacion('El stock debe ser un número válido', 'warning');
            $('#edit_stock').focus();
            return false;
        }
        
        if (!unidades_por_caja || parseInt(unidades_por_caja) < 1) {
            mostrarNotificacion('Las unidades por caja deben ser al menos 1', 'warning');
            $('#edit_unidades_por_caja').focus();
            return false;
        }

        if (!unidades_por_mayor || parseInt(unidades_por_mayor) < 2) {
            mostrarNotificacion('Las unidades por mayor deben ser al menos 2', 'warning');
            $('#edit_unidades_por_mayor').focus();
            return false;
        }
        
        return true;
    }
    
    function limpiarFormularioEditar() {
        $('#formEditarProducto')[0].reset();
        window.GaleriaProducto?.reset('#modalEditarProducto');
    }
})();
