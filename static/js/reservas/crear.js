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

function obtenerPrecioModalidad(item, modalidad) {
    if (modalidad === 'mayor') return item.precio_mayor > 0 ? item.precio_mayor : item.precio_unidad;
    if (modalidad === 'oferta') return item.en_oferta && item.precio_unidad_oferta > 0 ? item.precio_unidad_oferta : item.precio_unidad;
    return item.precio_unidad;
}

function puedeUsarMayor(item) {
    return (parseInt(item.unidades_por_caja, 10) || 1) > (parseInt(item.unidades_por_mayor, 10) || 3);
}

function cambiarModalidadReserva(item, modalidad) {
    item.modalidad = modalidad;
    item.precio_unitario = obtenerPrecioModalidad(item, modalidad);
    item.cantidad = modalidad === 'mayor' ? (parseInt(item.unidades_por_mayor, 10) || 3) : 1;
    item.descuento_valor = 0;
    item.descuento_tipo = 'ninguno';
    item.descuentoActivo = false;
}

const reservaItems = [];

function calcularDescuentoItem(item) {
    if (!item.descuentoActivo) return 0;
    if (item.descuento_tipo === 'fijo') {
        const precioFinal = Math.min(Math.max(item.descuento_valor || 0, 0), item.precio_unitario);
        return Math.max(Number(item.precio_unitario) - precioFinal, 0) * Number(item.cantidad);
    }
    return 0;
}

function actualizarFilaReserva(item, index) {
    const fila = document.querySelector(`tr[data-index="${index}"]`);
    if (!fila) return;
    const subtotal = Number(item.precio_unitario) * Number(item.cantidad);
    const descuento = calcularDescuentoItem(item);
    fila.children[1].textContent = formatCurrency(item.precio_unitario);
    fila.children[4].textContent = formatCurrency(subtotal);
    fila.children[6].textContent = formatCurrency(descuento);
    fila.children[7].textContent = formatCurrency(Math.max(subtotal - descuento, 0));
}

function actualizarResumenReserva() {
    const subtotal = roundMoney(reservaItems.reduce((sum, item) => sum + (Number(item.precio_unitario) * Number(item.cantidad)), 0));
    const descuento = roundMoney(reservaItems.reduce((sum, item) => sum + calcularDescuentoItem(item), 0));

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
                <td colspan="9" class="text-center text-muted py-4">Busca y agrega productos para construir la reserva.</td>
            </tr>`;
        actualizarResumenReserva();
        return;
    }

    reservaItems.forEach((item, index) => {
        body.insertAdjacentHTML('beforeend', `
            <tr data-index="${index}">
                <td>${item.codigo} - ${item.nombre}</td>
                <td>${formatCurrency(item.precio_unitario)}</td>
                <td>
                    <input type="number" min="1" class="form-control form-control-sm cantidad-item" data-index="${index}" value="${item.cantidad}">
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn ${item.modalidad === 'unidad' ? 'btn-primary' : 'btn-outline-primary'} modalidad-item" data-index="${index}" data-modalidad="unidad">Producto</button>
                        ${puedeUsarMayor(item) ? `<button type="button" class="btn ${item.modalidad === 'mayor' ? 'btn-primary' : 'btn-outline-primary'} modalidad-item" data-index="${index}" data-modalidad="mayor">Mayor</button>` : ''}
                        ${item.en_oferta && item.precio_unidad_oferta > 0 ? `<button type="button" class="btn ${item.modalidad === 'oferta' ? 'btn-primary' : 'btn-outline-primary'} modalidad-item" data-index="${index}" data-modalidad="oferta">Oferta</button>` : ''}
                    </div>
                </td>
                <td>${formatCurrency(item.precio_unitario * item.cantidad)}</td>
                <td>
                    <div class="custom-control custom-checkbox mb-1">
                        <input type="checkbox" class="custom-control-input descuento-activo-item"
                               id="descuentoActivoReserva-${index}" data-index="${index}"
                               ${item.descuentoActivo ? 'checked' : ''}>
                        <label class="custom-control-label small" for="descuentoActivoReserva-${index}">Aplicar descuento</label>
                    </div>
                    <input type="number" min="0" max="${Number(item.precio_unitario).toFixed(2)}" step="0.01"
                           class="form-control form-control-sm descuento-valor-item" data-index="${index}"
                           placeholder="Precio final / unidad"
                           value="${item.descuentoActivo && item.descuento_tipo === 'fijo' ? item.descuento_valor : ''}"
                           ${item.descuentoActivo ? '' : 'disabled'}>
                </td>
                <td class="text-danger descuento-monto">${formatCurrency(calcularDescuentoItem(item))}</td>
                <td class="font-weight-bold text-success">${formatCurrency(item.precio_unitario * item.cantidad - calcularDescuentoItem(item))}</td>
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
            const item = reservaItems[index];
            const minimo = item.modalidad === 'mayor' ? (parseInt(item.unidades_por_mayor, 10) || 3) : 1;
            item.cantidad = value >= minimo ? value : minimo;
            renderizarItemsReserva();
        });
    });

    document.querySelectorAll('.modalidad-item').forEach((button) => button.addEventListener('click', function () {
        const item = reservaItems[parseInt(this.dataset.index, 10)];
        if (!item) return;
        cambiarModalidadReserva(item, this.dataset.modalidad);
        renderizarItemsReserva();
    }));

    document.querySelectorAll('.btn-eliminar-item').forEach((button) => {
        button.addEventListener('click', function () {
            const index = parseInt(this.dataset.index, 10);
            reservaItems.splice(index, 1);
            renderizarItemsReserva();
        });
    });

    document.querySelectorAll('.descuento-activo-item').forEach((input) => input.addEventListener('change', function () {
        const item = reservaItems[parseInt(this.dataset.index, 10)];
        if (!item) return;
        item.descuentoActivo = this.checked;
        item.descuento_tipo = item.descuentoActivo && item.descuento_valor > 0 ? 'fijo' : 'ninguno';
        const inputValor = document.querySelector(`.descuento-valor-item[data-index="${this.dataset.index}"]`);
        if (inputValor) inputValor.disabled = !item.descuentoActivo;
        actualizarFilaReserva(item, parseInt(this.dataset.index, 10));
        actualizarResumenReserva();
    }));
    document.querySelectorAll('.descuento-valor-item').forEach((input) => input.addEventListener('input', function () {
        const item = reservaItems[parseInt(this.dataset.index, 10)];
        if (!item) return;
        item.descuento_valor = parseNumber(this.value);
        item.descuento_tipo = item.descuentoActivo && item.descuento_valor > 0 ? 'fijo' : 'ninguno';
        actualizarFilaReserva(item, parseInt(this.dataset.index, 10));
        actualizarResumenReserva();
    }));

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
                    precio_unidad: producto.precio_unidad || 0,
                    precio_mayor: producto.precio_mayor || 0,
                    precio_unidad_oferta: producto.precio_unidad_oferta || 0,
                    en_oferta: Boolean(producto.en_oferta),
                    unidades_por_caja: producto.unidades_por_caja || 1,
                    unidades_por_mayor: producto.unidades_por_mayor || 3,
                    cantidad: 1,
                    modalidad: 'unidad',
                    descuento_tipo: 'ninguno',
                    descuento_valor: 0,
                    descuentoActivo: false,
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
        ubicacion_tipo: document.getElementById('selectUbicacionInventario')?.value || 'tienda',
        items: reservaItems.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            modalidad: item.modalidad,
            precio_unitario: item.precio_unitario,
            descuento_tipo: item.descuentoActivo && item.descuento_tipo === 'fijo' && item.descuento_valor > 0 ? 'fijo' : 'ninguno',
            descuento_valor: item.descuentoActivo && item.descuento_tipo === 'fijo' && item.descuento_valor > 0
                ? item.descuento_valor
                : 0,
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

    const ubicacionInventario = document.getElementById('selectUbicacionInventario');
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
