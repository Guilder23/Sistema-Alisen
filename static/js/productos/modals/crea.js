// ================================================================
// MODAL CREAR PRODUCTO - VERSIÓN CON NOTIFICACIONES INTEGRADAS
// ================================================================

(function() {
    'use strict';
    
    window.inicializarModalCrear = function() {
        $('#modalCrearProducto').on('shown.bs.modal', function() {
            window.GaleriaProducto?.init(this);
        });

        // Limpiar cuando se cierra el modal
        $('#modalCrearProducto').on('hidden.bs.modal', function() {
            limpiarFormulario();
        });
        
        // Manejar submit con AJAX
        $(document).on('submit', '#formCrearProducto', function(e) {
            e.preventDefault();
            
            if (!validarFormulario()) {
                return false;
            }
            
            crearProductoAJAX();
        });
        
        console.log('✓ Modal Crear Producto inicializado');
    };
    
    function crearProductoAJAX() {
        const form = $('#formCrearProducto')[0];
        const formData = window.GaleriaProducto?.buildFormData(form) || new FormData(form);
        const nombreProducto = $('#nombre').val();
        
        // Deshabilitar botón submit
        const btnSubmit = $('#formCrearProducto button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.prop('disabled', true).html('<span class="spinner-border spinner-border-sm mr-2"></span>Guardando...');
        
        $.ajax({
            url: $('#formCrearProducto').attr('action'),
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
                btnSubmit.prop('disabled', false).html(textoOriginal);
                
                // Cerrar modal
                $('#modalCrearProducto').modal('hide');
                
                // Mostrar notificación
                mostrarNotificacion(
                    `Producto "${nombreProducto}" creado exitosamente`,
                    'success',
                    4000
                );
                
                // Recargar tabla
                setTimeout(function() {
                    location.reload();
                }, 1500);
            },
            error: function(xhr) {
                btnSubmit.prop('disabled', false).html(textoOriginal);
                
                let mensaje = 'Error al crear producto';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    mensaje = xhr.responseJSON.error;
                }
                
                mostrarNotificacion(mensaje, 'danger');
            }
        });
    }
    
    function validarFormulario() {
        const codigo = $('#codigo').val().trim();
        const nombre = $('#nombre').val().trim();
        const categoria = $('#categoria').val();
        const unidades_por_caja = $('#unidades_por_caja').val();
        const unidades_por_mayor = $('#unidades_por_mayor').val();
        
        if (!codigo) {
            mostrarNotificacion('El código del producto es requerido', 'warning');
            $('#codigo').focus();
            return false;
        }
        
        if (!nombre) {
            mostrarNotificacion('El nombre del producto es requerido', 'warning');
            $('#nombre').focus();
            return false;
        }

        if (!categoria) {
            mostrarNotificacion('Debe seleccionar una categoría', 'warning');
            $('#categoria').focus();
            return false;
        }
        
        if (!unidades_por_caja || parseInt(unidades_por_caja) < 1) {
            mostrarNotificacion('Las unidades por caja deben ser al menos 1', 'warning');
            $('#unidades_por_caja').focus();
            return false;
        }

        if (!unidades_por_mayor || parseInt(unidades_por_mayor) < 2) {
            mostrarNotificacion('Las unidades por mayor deben ser al menos 2', 'warning');
            $('#unidades_por_mayor').focus();
            return false;
        }
        
        return true;
    }
    
    function limpiarFormulario() {
        $('#formCrearProducto')[0].reset();
        window.GaleriaProducto?.reset('#modalCrearProducto');
    }
})();
