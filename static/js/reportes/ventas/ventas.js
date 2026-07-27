// JavaScript para el reporte de ventas

document.addEventListener('DOMContentLoaded', function() {
    // Auto-aplicar filtros al cambiar cualquier select o input
    document.querySelectorAll('#filtrosForm select, #filtrosForm input[type="date"]').forEach(element => {
        element.addEventListener('change', function() {
            document.getElementById('filtrosForm').submit();
        });
    });

    // Aplicar filtro de búsqueda al presionar Enter
    const buscarInput = document.getElementById('buscarInput');
    if (buscarInput) {
        buscarInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('filtrosForm').submit();
            }
        });
    }

    // Aplicar filtros de monto al presionar Enter
    ['montoMinimoInput', 'montoMaximoInput'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('filtrosForm').submit();
                }
            });
        }
    });
});

// Función para limpiar todos los filtros
function limpiarFiltros() {
    window.location.href = window.location.pathname;
}

// PDF de comisión: requiere un vendedor seleccionado (no "Todos")
function generarReporteComision() {
    const form = document.getElementById('filtrosForm');
    const vendedor = document.getElementById('vendedorFiltro');
    if (!vendedor || !vendedor.value) {
        alert('Seleccione un vendedor en los filtros (no "Todos") para generar el reporte de comisión.');
        if (vendedor) {
            vendedor.focus();
        }
        return;
    }

    const params = new URLSearchParams(new FormData(form));
    window.location.href = '/reportes/ventas/comision/?' + params.toString();
}
