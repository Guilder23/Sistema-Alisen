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
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value) {
    return parseNumber(value).toFixed(2);
}

function obtenerPrecioModalidad(item, modalidad) {
    if (modalidad === 'oferta') {
        return item.en_oferta && item.precio_unidad_oferta > 0 ? item.precio_unidad_oferta : item.precio_unidad;
    }
    if (modalidad === 'mayor') {
        return item.precio_mayor > 0 ? item.precio_mayor : item.precio_unidad;
    }
    if (modalidad === 'caja') {
        return item.precio_caja > 0 ? item.precio_caja : item.precio_unidad * (parseInt(item.unidades_por_caja, 10) || 1);
    }
    return item.precio_unidad;
}

function puedeUsarMayor(item) {
    return (parseInt(item.unidades_por_caja, 10) || 1) > (parseInt(item.unidades_por_mayor, 10) || 3);
}

function cambiarModalidadProforma(item, modalidad) {
    item.modalidad = modalidad;
    item.precio_unitario = obtenerPrecioModalidad(item, modalidad);
    item.cantidad = modalidad === 'mayor' ? (parseInt(item.unidades_por_mayor, 10) || 3) : 1;
    item.descuento_valor = 0;
    item.descuento_tipo = 'ninguno';
    item.descuentoActivo = false;
}

const proformaItems = [];

function calcularDescuentoItem(item) {
    if (!item.descuentoActivo) return 0;
    if (item.descuento_tipo === 'fijo') {
        const precioFinal = Math.min(Math.max(item.descuento_valor || 0, 0), item.precio_unitario);
        return Math.max(item.precio_unitario - precioFinal, 0) * item.cantidad;
    }
    return 0;
}

function actualizarFilaProforma(item, index) {
    const fila = document.querySelector(`tr[data-index="${index}"]`);
    if (!fila) return;
    const subtotal = item.precio_unitario * item.cantidad;
    const descuento = calcularDescuentoItem(item);
    fila.children[1].textContent = formatCurrency(item.precio_unitario);
    fila.children[4].textContent = formatCurrency(subtotal);
    const descuentoMonto = fila.querySelector('.descuento-monto');
    if (descuentoMonto) descuentoMonto.textContent = formatCurrency(descuento);
    fila.children[6].textContent = formatCurrency(descuento);
    fila.children[7].textContent = formatCurrency(Math.max(subtotal - descuento, 0));
}

function actualizarResumenProforma() {
    const subtotal = proformaItems.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);
    const descuento = proformaItems.reduce((sum, item) => sum + calcularDescuentoItem(item), 0);

    const total = Math.max(subtotal - descuento, 0);
    document.getElementById('subtotalGeneral').textContent = formatCurrency(subtotal);
    document.getElementById('descuentoGeneral').textContent = formatCurrency(descuento);
    document.getElementById('totalGeneral').textContent = formatCurrency(total);
}

function renderizarItemsProforma() {
    const body = document.getElementById('itemsBody');
    body.innerHTML = '';

    if (proformaItems.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    Busca y agrega productos para construir la proforma.
                </td>
            </tr>`;
        actualizarResumenProforma();
        return;
    }

    proformaItems.forEach((item, index) => {
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
                        <input type="checkbox" class="custom-control-input descuento-activo-item" id="descuentoActivoProforma-${index}" data-index="${index}" ${item.descuentoActivo ? 'checked' : ''}>
                        <label class="custom-control-label small" for="descuentoActivoProforma-${index}">Aplicar descuento</label>
                    </div>
                    <input type="number" min="0" max="${Number(item.precio_unitario).toFixed(2)}" step="0.01" class="form-control form-control-sm descuento-valor-item" data-index="${index}" placeholder="Precio final / unidad" value="${item.descuentoActivo && item.descuento_tipo === 'fijo' ? item.descuento_valor : ''}" ${item.descuentoActivo ? '' : 'disabled'}>
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
            const item = proformaItems[index];
            const minimo = item.modalidad === 'mayor' ? (parseInt(item.unidades_por_mayor, 10) || 3) : 1;
            item.cantidad = value >= minimo ? value : minimo;
            renderizarItemsProforma();
        });
    });

    document.querySelectorAll('.modalidad-item').forEach((button) => button.addEventListener('click', function () {
        const item = proformaItems[parseInt(this.dataset.index, 10)];
        if (!item) return;
        cambiarModalidadProforma(item, this.dataset.modalidad);
        renderizarItemsProforma();
    }));

    document.querySelectorAll('.descuento-activo-item').forEach((input) => input.addEventListener('change', function () {
        const item = proformaItems[parseInt(this.dataset.index, 10)];
        if (!item) return;
        item.descuentoActivo = this.checked;
        item.descuento_tipo = item.descuentoActivo && item.descuento_valor > 0 ? 'fijo' : 'ninguno';
        const valor = document.querySelector(`.descuento-valor-item[data-index="${this.dataset.index}"]`);
        if (valor) valor.disabled = !item.descuentoActivo;
        actualizarFilaProforma(item, parseInt(this.dataset.index, 10));
        actualizarResumenProforma();
    }));
    document.querySelectorAll('.descuento-valor-item').forEach((input) => input.addEventListener('input', function () {
        const index = parseInt(this.dataset.index, 10);
        const item = proformaItems[index];
        item.descuento_valor = parseNumber(this.value);
        item.descuento_tipo = item.descuentoActivo && item.descuento_valor > 0 ? 'fijo' : 'ninguno';
        actualizarFilaProforma(item, index);
        actualizarResumenProforma();
    }));

    document.querySelectorAll('.btn-eliminar-item').forEach((button) => {
        button.addEventListener('click', function () {
            const index = parseInt(this.dataset.index, 10);
            proformaItems.splice(index, 1);
            renderizarItemsProforma();
        });
    });

    actualizarResumenProforma();
}

function mostrarProductosResultado(productos) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    if (!productos.length) {
        container.innerHTML = `<div class="alert alert-light mb-0 text-center">No se encontraron productos.</div>`;
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
            const productoExistente = proformaItems.find((item) => item.producto_id === producto.id);
            if (productoExistente) {
                productoExistente.cantidad += 1;
            } else {
                proformaItems.push({
                    producto_id: producto.id,
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    precio_unitario: producto.precio_unidad || 0,
                    precio_unidad: producto.precio_unidad || 0,
                    precio_mayor: producto.precio_mayor || 0,
                    precio_caja: producto.precio_caja || 0,
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
            renderizarItemsProforma();
        });
    });
}

function buscarProductosProforma(query) {
    const results = document.getElementById('searchResults');
    if (!query || query.length < 2) {
        results.innerHTML = '';
        return;
    }

    const tipoUbicacion = document.getElementById('selectTipoUbicacion')?.value || 'tienda';
    fetch(`${PROFORMAS_URLS.buscarProductos}?q=${encodeURIComponent(query)}&tipo_ubicacion=${encodeURIComponent(tipoUbicacion)}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.productos) {
                mostrarProductosResultado(data.productos);
            }
        })
        .catch((error) => {
            console.error('Error al buscar productos:', error);
            document.getElementById('searchResults').innerHTML = `<div class="alert alert-danger mb-0">Error buscando productos.</div>`;
        });
}

function enviarProforma(event) {
    event.preventDefault();

    const cliente = document.getElementById('inputCliente').value.trim();
    const nit = document.getElementById('inputNit').value.trim();
    const telefono = document.getElementById('inputTelefono').value.trim();
    const razonSocial = document.getElementById('inputRazonSocial').value.trim();
    const direccion = document.getElementById('inputDireccion').value.trim();
    const comentario = document.getElementById('inputComentario').value.trim();
    const tipoUbicacion = document.getElementById('selectTipoUbicacion')?.value || 'tienda';

    if (!cliente) {
        Swal.fire({ icon: 'warning', title: 'Cliente requerido', text: 'Ingresa el nombre del cliente.' });
        return;
    }

    if (proformaItems.length === 0) {
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
        tipo_ubicacion: tipoUbicacion,
        items: proformaItems.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            modalidad: item.modalidad,
            precio_unitario: item.precio_unitario,
            descuento_tipo: item.descuentoActivo && item.descuento_tipo === 'fijo' && item.descuento_valor > 0 ? 'fijo' : 'ninguno',
            descuento_valor: item.descuentoActivo && item.descuento_tipo === 'fijo' && item.descuento_valor > 0 ? item.descuento_valor : 0,
        })),
    };

    fetch(PROFORMAS_URLS.guardarProforma, {
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
                Swal.fire({ icon: 'success', title: 'Proforma guardada', text: 'La proforma se ha guardado correctamente.' }).then(() => {
                    window.location.href = PROFORMAS_URLS.listarProformas;
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Error al guardar la proforma.' });
            }
        })
        .catch((error) => {
            console.error('Error al guardar la proforma:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la proforma.' });
        });
}

function inicializarModalProforma() {
    const buscarInput = document.getElementById('inputBuscarProducto');
    if (buscarInput) {
        buscarInput.addEventListener('input', function () {
            buscarProductosProforma(this.value.trim());
        });
    }

    const tipoUbicacion = document.getElementById('selectTipoUbicacion');
    if (tipoUbicacion) {
        tipoUbicacion.addEventListener('change', function () {
            buscarProductosProforma(buscarInput.value.trim());
        });
    }

    const form = document.getElementById('formCrearProforma');
    if (form) form.addEventListener('submit', enviarProforma);

    renderizarItemsProforma();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarModalProforma);
} else {
    inicializarModalProforma();
}
