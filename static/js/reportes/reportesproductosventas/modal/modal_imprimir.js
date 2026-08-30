let orientacionActual = 'landscape';

$('#modalImprimir').on('shown.bs.modal', function() {
    generarVistaPreviaTablaProductos();
    aplicarOrientacionProductos();
});

document.querySelectorAll('.columna-imprimir').forEach(cb => {
    cb.addEventListener('change', function() {
        generarVistaPreviaTablaProductos();
    });
});

const btnOrientacion = document.getElementById('btnCambiarOrientacion');
if (btnOrientacion) {
    btnOrientacion.addEventListener('click', function() {
        orientacionActual = (orientacionActual === 'portrait') ? 'landscape' : 'portrait';
        aplicarOrientacionProductos();
        generarVistaPreviaTablaProductos();
    });
}

function aplicarOrientacionProductos() {
    const modal = document.getElementById('modalImprimir');
    const span = btnOrientacion ? btnOrientacion.querySelector('span') : null;
    if (orientacionActual === 'landscape') {
        modal.classList.add('orientation-landscape');
        modal.classList.remove('orientation-portrait');
        if (span) span.textContent = 'Cambiar a Vertical';
    } else {
        modal.classList.add('orientation-portrait');
        modal.classList.remove('orientation-landscape');
        if (span) span.textContent = 'Cambiar a Horizontal';
    }
}

function generarVistaPreviaTablaProductos() {
    const tablaOriginal = document.getElementById('tablaProductosVentas');
    if (!tablaOriginal) return;

    const columnasVisibles = Array.from(document.querySelectorAll('.columna-imprimir'))
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));

    const headersOriginal = Array.from(tablaOriginal.querySelectorAll('thead th'))
        .map(th => th.textContent.trim());

    const thead = document.querySelector('#tablaVistaPreviaProductos thead');
    const tbody = document.querySelector('#tablaVistaPreviaProductos tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const trHead = document.createElement('tr');
    columnasVisibles.forEach(i => {
        const th = document.createElement('th');
        th.textContent = headersOriginal[i] || '';
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    const rows = tablaOriginal.querySelectorAll('tbody tr');
    rows.forEach(row => {
        if (row.querySelectorAll('td').length < 2) return;
        const celdas = Array.from(row.querySelectorAll('td'));
        const tr = document.createElement('tr');
        columnasVisibles.forEach(i => {
            const td = document.createElement('td');
            if (celdas[i]) {
                td.innerHTML = celdas[i].innerHTML;
                td.style.textAlign = celdas[i].style.textAlign || '';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    const totalValues = {
        4: `Bs. ${tablaOriginal.dataset.totalPrecioCompra || '0.00'}`,
        5: tablaOriginal.dataset.totalCantidad || '0',
        6: tablaOriginal.dataset.totalCajas || '0',
        7: `Bs. ${tablaOriginal.dataset.precioPromedioGlobal || '0.00'}`,
        8: `Bs. ${tablaOriginal.dataset.totalCosto || '0.00'}`,
        9: `Bs. ${tablaOriginal.dataset.totalDescuento || '0.00'}`,
        10: `Bs. ${tablaOriginal.dataset.totalVentas || '0.00'}`,
        11: `Bs. ${tablaOriginal.dataset.totalUtilidad || '0.00'}`,
        12: `${tablaOriginal.dataset.margenGlobal || '0.0'}%`,
        13: tablaOriginal.dataset.totalNumVentas || '0',
    };
    const filaResumen = document.createElement('tr');
    filaResumen.style.fontWeight = '700';
    filaResumen.style.background = '#f8f9fc';
    columnasVisibles.forEach((i, posicion) => {
        const td = document.createElement('td');
        td.textContent = posicion === 0 ? 'TOTALES' : (totalValues[i] || '-');
        td.style.textAlign = i >= 4 ? 'right' : 'center';
        filaResumen.appendChild(td);
    });

    tbody.appendChild(filaResumen);
}

function ejecutarImpresionProductos() {
    const contenido = document.getElementById('contenedorVistaPreviaProductos');
    if (!contenido) return;

    const ventana = window.open('', '_blank');
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(l => l.outerHTML).join('\n');

    ventana.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reporte de Ventas por Productos</title>
            ${cssLinks}
            <style>
                @page { size: ${orientacionActual === 'landscape' ? 'landscape' : 'portrait'}; margin: 1cm; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; color: #2c3e50; font-size: 11px; }
                .preview-paper { padding: 0 !important; box-shadow: none !important; }
                table { width: 100%; border-collapse: collapse; font-size: 10px; }
                th, td { border: 1px solid #999; padding: 4px 6px; }
                th { background: #4e73df !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                tr:nth-child(even) td { background: #f8f9fc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .header-reporte { border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 10px; }
                .header-grid { display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: center; gap: 8px; }
                .header-center { text-align: center; }
                .header-right { text-align: right; }
                .logo-header-compact { height: 36px; }
                .resumen-impresion { background: #f0f0f0 !important; border: 1px solid #ccc !important; padding: 8px; margin-bottom: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .resumen-imp-item { border-right: 1px solid #ccc; }
                .resumen-imp-item:last-child { border-right: none; }
                .margen-positivo, .text-success { color: #166534 !important; font-weight: 600; }
                .margen-negativo, .text-danger { color: #991b1b !important; font-weight: 600; }
                .text-primary { color: #4e73df !important; font-weight: 600; }
            </style>
        </head>
        <body>
            ${contenido.innerHTML}
        </body>
        </html>
    `);

    ventana.document.close();
    setTimeout(() => {
        ventana.focus();
        ventana.print();
    }, 500);
}
