document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('eliminarBannerForm');
    if (form) {
        form.addEventListener('submit', function (event) {
            if (!window.confirm('¿Confirmas que deseas eliminar este banner?')) {
                event.preventDefault();
            }
        });
    }
});
