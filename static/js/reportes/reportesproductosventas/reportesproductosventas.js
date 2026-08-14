document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#filtrosForm select, #filtrosForm input[type="date"]').forEach(element => {
        element.addEventListener('change', function() {
            document.getElementById('filtrosForm').submit();
        });
    });

    const buscarInput = document.getElementById('buscarInput');
    if (buscarInput) {
        buscarInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('filtrosForm').submit();
            }
        });
    }

    ['ventasMinimasInput', 'utilidadMinimaInput'].forEach(id => {
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

function limpiarFiltros() {
    window.location.href = window.location.pathname;
}
