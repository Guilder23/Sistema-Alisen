(function() {
    'use strict';

    $(document).ready(function() {
        console.log('Ver.js: document.ready ejecutado');

        $(document).on('click', '.btn-ver-producto-contenedor', function(e) {
            console.log('Ver.js: Click en btn-ver-producto-contenedor');
            e.preventDefault();
            const pcId = $(this).data('pc-id');
            const nombre = $(this).data('nombre');
            const codigo = $(this).data('codigo');
            const cantidad = $(this).data('cantidad');
            const cantidadRecibida = $(this).data('cantidad-recibida');
            const categoria = $(this).data('categoria');
            const subcategoria = $(this).data('subcategoria');
            
            cargarYMostrarProducto(pcId, nombre, codigo, cantidad, cantidadRecibida, categoria, subcategoria);
        });
    });

    function cargarYMostrarProducto(pcId, nombre, codigo, cantidad, cantidadRecibida, categoria, subcategoria) {
        console.log('Ver.js: Mostrando datos del producto:', { pcId, nombre, codigo, cantidad, cantidadRecibida });
        
        // Calcular cantidad movida
        const cantidadMovida = cantidadRecibida - cantidad;
        
        $('#verPCId').text(pcId);
        $('#verNombre').text(nombre || 'No especificado');
        $('#verCodigo').text(codigo || 'No especificado');
        $('#verCategoriaProductoContenedor').text(categoria || 'Sin categoría');
        $('#verSubcategoriaProductoContenedor').text(subcategoria || 'Sin subcategoría');
        $('#verCantidadRecibida').html(`<span class="badge-modal-recibida">${cantidadRecibida} unidades</span>`);
        $('#verCantidad').html(`<span class="badge-modal-disponible">${cantidad} unidades</span>`);
        $('#verCantidadMovida').html(`<span class="badge-modal-movida">${cantidadMovida} unidades</span>`);

        console.log('Ver.js: Abriendo modal...');
        $('#modalVerProductoContenedor').modal('show');
    }
})();
