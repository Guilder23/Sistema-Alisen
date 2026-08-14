document.addEventListener('DOMContentLoaded', function () {
    const currentUrl = window.location.pathname;
    if (currentUrl.includes('/ver/')) {
        console.log('Vista de reserva abierta');
    }
});
