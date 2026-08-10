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

let proformaItems = [];

function actualizarResumenProforma() {
    const subtotal = proformaItems.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);
    const descuentoTipo = document.getElementById('selectDescuentoTipo').value;
    const descuentoValor = parseNumber(document.getElementById('inputDescuentoValor').value);

    let descuento = 0;
    if (descuentoTipo === 'fijo') {
        descuento = descuentoValor;
    } else if (descuentoTipo === 'porcentaje') {
        descuento = (subtotal * descuentoValor) / 100;
    }

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
                <td colspan="6" class="text-center text-muted py-4">No hay productos agregados.</td>
            </tr>`;
        actualizarResumenProforma();
        return;
    }

    proformaItems.forEach((item, index) => {
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
            proformaItems[index].cantidad = value > 0 ? value : 1;
            renderizarItemsProforma();
        });
    });

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
                    cantidad: 1,
                    modalidad: 'unidad',
                });
            }
            renderizarItemsProforma();
        });
    });
}

function buscarProductosProforma(query) {
    if (!query || query.length < 2) {
        document.getElementById('searchResults').innerHTML = '';
        return;
    }

    fetch(`${PROFORMAS_EDITAR_URLS.buscarProductos}?q=${encodeURIComponent(query)}`)
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

function cargarDatosProforma() {
    fetch(PROFORMAS_EDITAR_URLS.obtenerProforma)
        .then((response) => response.json())
        .then((data) => {
            if (!data.proforma) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la proforma.' });
                return;
            }

            const proforma = data.proforma;
            proformaItems = data.items.map((item) => ({
                producto_id: item.producto_id,
                codigo: item.producto_codigo,
                nombre: item.producto_nombre,
                precio_unitario: item.precio_unitario,
                cantidad: item.cantidad,
                modalidad: item.modalidad,
            }));

            document.getElementById('inputCliente').value = proforma.cliente;
            document.getElementById('inputNit').value = proforma.nit;
            document.getElementById('inputTelefono').value = proforma.telefono;
            document.getElementById('inputRazonSocial').value = proforma.razon_social;
            document.getElementById('inputDireccion').value = proforma.direccion;
            document.getElementById('inputComentario').value = proforma.comentario;
            document.getElementById('inputMoneda').value = proforma.moneda;
            document.getElementById('inputTipoCambio').value = proforma.tipo_cambio;
            document.getElementById('selectDescuentoTipo').value = proforma.descuento_tipo;
            document.getElementById('inputDescuentoValor').value = proforma.descuento_valor;

            renderizarItemsProforma();
        })
        .catch((error) => {
            console.error('Error al cargar la proforma:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la proforma.' });
        });
}

function enviarActualizacionProforma(event) {
    event.preventDefault();

    const cliente = document.getElementById('inputCliente').value.trim();
    const nit = document.getElementById('inputNit').value.trim();
    const telefono = document.getElementById('inputTelefono').value.trim();
    const razonSocial = document.getElementById('inputRazonSocial').value.trim();
    const direccion = document.getElementById('inputDireccion').value.trim();
    const comentario = document.getElementById('inputComentario').value.trim();
    const moneda = document.getElementById('inputMoneda').value;
    const tipoCambio = document.getElementById('inputTipoCambio').value;
    const descuentoTipo = document.getElementById('selectDescuentoTipo').value;
    const descuentoValor = document.getElementById('inputDescuentoValor').value;

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
        moneda,
        tipo_cambio: tipoCambio,
        descuento_tipo: descuentoTipo,
        descuento_valor: descuentoValor,
        items: proformaItems.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            modalidad: item.modalidad,
            precio_unitario: item.precio_unitario,
        })),
    };

    fetch(PROFORMAS_EDITAR_URLS.actualizarProforma, {
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
                Swal.fire({ icon: 'success', title: 'Proforma actualizada', text: 'Los cambios fueron guardados con éxito.' }).then(() => {
                    window.location.href = PROFORMAS_EDITAR_URLS.listarProformas;
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Error al actualizar la proforma.' });
            }
        })
        .catch((error) => {
            console.error('Error al actualizar la proforma:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la proforma.' });
        });
}

function inicializarEdicionProforma() {
    const buscarInput = document.getElementById('inputBuscarProducto');
    if (buscarInput) {
        buscarInput.addEventListener('input', function () {
            buscarProductosProforma(this.value.trim());
        });
    }

    const descuentoTipo = document.getElementById('selectDescuentoTipo');
    const descuentoValor = document.getElementById('inputDescuentoValor');
    if (descuentoTipo) descuentoTipo.addEventListener('change', actualizarResumenProforma);
    if (descuentoValor) descuentoValor.addEventListener('input', actualizarResumenProforma);

    const form = document.getElementById('formEditarProforma');
    if (form) form.addEventListener('submit', enviarActualizacionProforma);

    cargarDatosProforma();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarEdicionProforma);
} else {
    inicializarEdicionProforma();
}
