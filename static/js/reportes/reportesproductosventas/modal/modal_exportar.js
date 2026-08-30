function seleccionarTodasColumnas(checked) {
    document.querySelectorAll('.columna-exportar').forEach(cb => {
        cb.checked = checked;
    });
}

function confirmarExportacion() {
    const columnas = Array.from(document.querySelectorAll('.columna-exportar:checked'))
        .map(cb => parseInt(cb.value));

    if (columnas.length === 0) {
        alert('Selecciona al menos una columna para exportar.');
        return;
    }

    const tabla = document.getElementById('tablaProductosVentas');
    if (!tabla) return;

    const headersOriginal = Array.from(tabla.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = Array.from(tabla.querySelectorAll('tbody tr:not(:empty)'));

    const headers = columnas.map(i => headersOriginal[i] || ('Columna ' + i));
    const escaparCsv = valor => `"${String(valor).replace(/"/g, '""')}"`;

    let csv = headers.map(escaparCsv).join(';') + '\r\n';

    rows.forEach(row => {
        const celdas = Array.from(row.querySelectorAll('td'));
        const fila = columnas.map(i => {
            if (celdas[i]) {
                return celdas[i].innerText.trim().replace(/\s+/g, ' ');
            }
            return '';
        });
        csv += fila.map(escaparCsv).join(';') + '\r\n';
    });

    const totalValues = {
        4: `Bs. ${tabla.dataset.totalPrecioCompra || '0.00'}`,
        5: tabla.dataset.totalCantidad || '0',
        6: tabla.dataset.totalCajas || '0',
        7: `Bs. ${tabla.dataset.precioPromedioGlobal || '0.00'}`,
        8: `Bs. ${tabla.dataset.totalCosto || '0.00'}`,
        9: `Bs. ${tabla.dataset.totalDescuento || '0.00'}`,
        10: `Bs. ${tabla.dataset.totalVentas || '0.00'}`,
        11: `Bs. ${tabla.dataset.totalUtilidad || '0.00'}`,
        12: `${tabla.dataset.margenGlobal || '0.0'}%`,
        13: tabla.dataset.totalNumVentas || '0',
    };
    csv += columnas.map((i, posicion) => escaparCsv(
        posicion === 0 ? 'TOTALES' : (totalValues[i] || '-')
    )).join(';') + '\r\n';

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `reporte_ventas_productos_${fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    $('#modalExportar').modal('hide');
}
