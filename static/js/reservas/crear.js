function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function parseNumber(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value) {
    return roundMoney(parseNumber(value)).toFixed(2);
}

const reservaItems = [];

function actualizarResumenReserva() {
    const subtotal = roundMoney(reservaItems.reduce((sum, item) => sum + (Number(item.precio_unitario) * Number(item.cantidad)), 0));
    const descuentoTipo = document.getElementById('selectDescuentoTipo').value;
    const descuentoValor = parseNumber(document.getElementById('inputDescuentoValor').value);

    let descuento = 0;
    if (descuentoTipo === 'fijo') {
        descuento = roundMoney(descuentoValor);
    } else if (descuentoTipo === 'porcentaje') {
        descuento = roundMoney((subtotal * descuentoValor) / 100);
    }

    const total = roundMoney(Math.max(subtotal - descuento, 0));
    document.getElementById('subtotalGeneral').textContent = formatCurrency(subtotal);
    document.getElementById('descuentoGeneral').textContent = formatCurrency(descuento);
    document.getElementById('totalGeneral').textContent = formatCurrency(total);
}

function renderizarItemsReserva() {
    const body = document.getElementById('itemsBody');
    body.innerHTML = '';

    if (reservaItems.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">Busca y agrega productos para construir la reserva.</td>
            </tr>`;
        actualizarResumenReserva();
        return;
    }

    reservaItems.forEach((item, index) => {
        body.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${item.codigo} - ${item.nombre}</td>
                <td>${formatCurrency(item.precio_unitario)}</td>
                <td>
                    <input type="number" min="1" class="form-control form-control-sm cantidad-item" data-index="${index}" value="${item.cantidad}">
                </td>
                <td>${item.modalidad}</td>
                <td>${formatCurrency(item.precio_unitario * item.cantidad)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-item" data-index="${index}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`);
    });

    document.querySelectorAll('.cantidad-item').forEach((input) => {
        input.addEventListener('change', function () {
            const index = parseInt(this.dataset.index, 10);
            const value = parseInt(this.value, 10);
            reservaItems[index].cantidad = value > 0 ? value : 1;
            renderizarItemsReserva();
        });
    });

    document.querySelectorAll('.btn-eliminar-item').forEach((button) => {
        button.addEventListener('click', function () {
            const index = parseInt(this.dataset.index, 10);
            reservaItems.splice(index, 1);
            renderizarItemsReserva();
        });
    });

    actualizarResumenReserva();
}

function mostrarProductosResultado(productos) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    if (!productos.length) {
        container.innerHTML = '<div class="alert alert-light mb-0 text-center">No se encontraron productos.</div>';
        return;
    }

    productos.forEach((producto) => {
        const item = document.createElement('div');
        item.className = 'resultado-producto d-flex justify-content-between align-items-center p-2 border-bottom';
        item.innerHTML = `
            <div>
                <div class="font-weight-bold">${producto.codigo} - ${producto.nombre}</div>
                <div class="text-muted small">Stock: ${producto.stock}</div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-primary btn-agregar-producto" data-producto='${JSON.stringify(producto)}'>
                <i class="fas fa-plus"></i>
            </button>`;
        container.appendChild(item);
    });

    document.querySelectorAll('.btn-agregar-producto').forEach((button) => {
        button.addEventListener('click', function () {
            const producto = JSON.parse(this.dataset.producto);
            const productoExistente = reservaItems.find((item) => item.producto_id === producto.id);
            if (productoExistente) {
                productoExistente.cantidad += 1;
            } else {
                reservaItems.push({
                    producto_id: producto.id,
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    precio_unitario: producto.precio_unidad || 0,
                    cantidad: 1,
                    modalidad: 'unidad',
                });
            }
            renderizarItemsReserva();
        });
    });
}

function buscarProductosReserva(query) {
    const results = document.getElementById('searchResults');
    const tipoUbicacion = document.getElementById('selectUbicacionInventario')?.value || 'tienda';
    if (!query || query.length < 2) {
        results.innerHTML = '';
        return;
    }

    fetch(`${RESERVAS_URLS.buscarProductos}?q=${encodeURIComponent(query)}&tipo_ubicacion=${encodeURIComponent(tipoUbicacion)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.productos) {
                mostrarProductosResultado(data.productos);
            }
        })
        .catch((error) => {
            console.error('Error al buscar productos:', error);
            results.innerHTML = '<div class="alert alert-danger mb-0">Error buscando productos.</div>';
        });
}

function guardarReserva(event) {
    event.preventDefault();

    const cliente = document.getElementById('inputCliente').value.trim();
    const nit = document.getElementById('inputNit').value.trim();
    const telefono = document.getElementById('inputTelefono').value.trim();
    const razonSocial = document.getElementById('inputRazonSocial').value.trim();
    const direccion = document.getElementById('inputDireccion').value.trim();
    const comentario = document.getElementById('inputComentario').value.trim();
    const tipoPago = 'contado';
    const metodoPago = document.getElementById('inputMetodoPago').value;
    const moneda = 'BOB';
    const tipoCambio = '1';
    const descuentoTipo = document.getElementById('selectDescuentoTipo').value;
    const descuentoValor = document.getElementById('inputDescuentoValor').value;

    if (!cliente) {
        Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Ingresa el nombre del cliente.' });
        return;
    }

    if (reservaItems.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Agrega productos', text: 'Debes agregar al menos un producto.' });
        return;
    }

    const payload = {
        cliente,
        nit,
        telefono,
        razon_social: razonSocial,
        direccion,
        comentario,
        tipo_pago: tipoPago,
        metodo_pago: metodoPago,
        moneda,
        tipo_cambio: tipoCambio,
        descuento_tipo: descuentoTipo,
        descuento_valor: descuentoValor,
        ubicacion_tipo: document.getElementById('selectUbicacionInventario')?.value || 'tienda',
        items: reservaItems.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            modalidad: item.modalidad,
            precio_unitario: item.precio_unitario,
        })),
    };

    fetch(RESERVAS_URLS.guardarReserva, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(payload),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Reserva guardada', text: 'La reserva se ha guardado correctamente.' }).then(() => {
                    window.location.href = RESERVAS_URLS.listarReservas;
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Error al guardar la reserva.' });
            }
        })
        .catch((error) => {
            console.error('Error al guardar la reserva:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la reserva.' });
        });
}

function inicializarFormularioReserva() {
    const buscarInput = document.getElementById('inputBuscarProducto');
    if (buscarInput) {
        buscarInput.addEventListener('input', function () {
            buscarProductosReserva(this.value.trim());
        });
    }

    const descuentoTipo = document.getElementById('selectDescuentoTipo');
    const descuentoValor = document.getElementById('inputDescuentoValor');
    const ubicacionInventario = document.getElementById('selectUbicacionInventario');
    if (descuentoTipo) descuentoTipo.addEventListener('change', actualizarResumenReserva);
    if (descuentoValor) descuentoValor.addEventListener('input', actualizarResumenReserva);
    if (ubicacionInventario) {
        ubicacionInventario.addEventListener('change', function () {
            const query = document.getElementById('inputBuscarProducto')?.value.trim() || '';
            if (query.length >= 2) {
                buscarProductosReserva(query);
            } else {
                document.getElementById('searchResults').innerHTML = '';
            }
        });
    }

    const form = document.getElementById('formCrearReserva');
    if (form) form.addEventListener('submit', guardarReserva);

    renderizarItemsReserva();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFormularioReserva);
} else {
    inicializarFormularioReserva();
}
