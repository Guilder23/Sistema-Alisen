let detalleData = null;

function verDetalleProducto(evt) {
    var ev = evt || window.event;
    var btn = null;
    if (ev && ev.currentTarget && ev.currentTarget.tagName === 'BUTTON') {
        btn = ev.currentTarget;
    } else if (ev && ev.target) {
        btn = ev.target.closest('button');
    }
    if (!btn) return;
    const data = btn.dataset;
    detalleData = data;

    document.getElementById('detalleCodigo').textContent = data.codigo || '-';
    document.getElementById('detalleNombre').textContent = data.nombre || '-';
    document.getElementById('detalleCategoria').textContent = data.categoria || '-';
    document.getElementById('detalleGenero').textContent = data.genero || '-';

    const precioCompra = parseFloat(data.precioCompra || 0);
    const precioPromedio = parseFloat(data.precioPromedio || 0);
    const cantidad = parseInt(data.cantidadTotal || 0);
    const cajas = parseInt(data.cajasTotal || 0);
    const numVentas = parseInt(data.numVentas || 0);
    const costoTotal = parseFloat(data.costoTotal || 0);
    const ventasTotal = parseFloat(data.ventasTotal || 0);
    const utilidad = parseFloat(data.utilidad || 0);
    const margen = parseFloat(data.margen || 0);

    const fmt = (n) => 'Bs. ' + Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    document.getElementById('detallePrecioCompra').textContent = fmt(precioCompra);
    document.getElementById('detallePrecioPromedio').textContent = fmt(precioPromedio);
    document.getElementById('detalleCantidad').textContent = cantidad.toLocaleString('es-BO');
    document.getElementById('detalleCajas').textContent = cajas.toLocaleString('es-BO') + ' cajas';
    document.getElementById('detalleNumVentas').textContent = numVentas.toLocaleString('es-BO');
    document.getElementById('detalleCostoTotal').textContent = fmt(costoTotal);
    document.getElementById('detalleVentasTotal').textContent = fmt(ventasTotal);
    document.getElementById('detalleUtilidad').textContent = fmt(utilidad);
    document.getElementById('detalleMargen').textContent = margen.toFixed(1) + '%';

    const imgWrapper = document.getElementById('detalleProductoImagen');
    const fila = btn.closest('tr');
    const imgElement = fila ? fila.querySelector('.producto-thumb') : document.querySelector('.producto-thumb');
    if (imgElement && imgElement.src) {
        imgWrapper.innerHTML = '<img src="' + imgElement.src + '" alt="' + (data.nombre || '') + '" style="max-width:100%;max-height:100%;object-fit:contain;">';
    } else {
        imgWrapper.innerHTML = '<i class="fas fa-box fa-4x text-muted"></i>';
    }

    let pctCosto, pctUtilidad;
    if (ventasTotal > 0) {
        pctCosto = (costoTotal / ventasTotal) * 100;
        pctUtilidad = Math.max(0, (utilidad / ventasTotal) * 100);
    } else {
        pctCosto = 50;
        pctUtilidad = 50;
    }
    if (pctCosto + pctUtilidad > 100) {
        pctUtilidad = Math.max(0, 100 - pctCosto);
    }

    document.getElementById('barraCosto').style.width = pctCosto + '%';
    document.getElementById('barraUtilidad').style.width = pctUtilidad + '%';
    document.getElementById('pctCosto').textContent = pctCosto.toFixed(0) + '%';
    document.getElementById('pctUtilidad').textContent = pctUtilidad.toFixed(0) + '%';

    $('#modalDetalleProducto').modal('show');
}

function imprimirDetalleProducto() {
    window.print();
}
