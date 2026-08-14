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

    let csv = headers.join(',') + '\n';

    rows.forEach(row => {
        const celdas = Array.from(row.querySelectorAll('td'));
        const fila = columnas.map(i => {
            if (celdas[i]) {
                let txt = celdas[i].innerText.trim().replace(/\s+/g, ' ');
                if (txt.includes(',') || txt.includes('"')) {
                    txt = '"' + txt.replace(/"/g, '""') + '"';
                }
                return txt;
            }
            return '';
        });
        csv += fila.join(',') + '\n';
    });

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
