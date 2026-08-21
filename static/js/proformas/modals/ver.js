function formatCurrency(value) {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? '0.00' : parsed.toFixed(2);
}

function renderProformaDetalle(data) {
    const body = document.getElementById('detalleProformaBody');
    body.innerHTML = '';

    if (!data.items || data.items.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">Esta proforma no tiene productos.</td>
            </tr>`;
        return;
    }

    data.items.forEach((item) => {
        body.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${item.producto_codigo} - ${item.producto_nombre}</td>
                <td>${item.modalidad}</td>
                <td>${item.cantidad}</td>
                <td>${formatCurrency(item.precio_unitario)}</td>
                <td>${formatCurrency(item.subtotal)}</td>
                <td class="text-danger">- ${formatCurrency(item.descuento)}</td>
                <td class="font-weight-bold text-success">${formatCurrency(item.subtotal_neto)}</td>
            </tr>`);
    });
}

function cargarProforma() {
    fetch(PROFORMAS_VER_URLS.obtenerProforma)
        .then((response) => response.json())
        .then((data) => {
            if (data.proforma) {
                renderProformaDetalle(data);
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener la proforma.' });
            }
        })
        .catch((error) => {
            console.error('Error al obtener la proforma:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la proforma.' });
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarProforma);
} else {
    cargarProforma();
}
