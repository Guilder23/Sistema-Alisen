document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('eliminarTiendaPaginaForm');
    if (form) {
        form.addEventListener('submit', function (event) {
            if (!window.confirm('¿Confirmas que deseas quitar esta tienda de la página?')) {
                event.preventDefault();
            }
        });
    }
});
