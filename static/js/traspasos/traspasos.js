// Script principal para traspasos

// Variables globales compartidas entre módulos
let productosSeleccionados = [];
let productosDisponibles = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeCambiarEstado();
    initializeTraspasosFilters();
});

function initializeTraspasosFilters() {
    const searchInput = document.getElementById('traspasosSearch');
    const filterButtons = Array.from(document.querySelectorAll('.traspasos-filter-btn'));
    const sortButtons = Array.from(document.querySelectorAll('[data-sort-order]'));
    const tabLinks = document.querySelectorAll('#traspasosTabs [data-toggle="tab"]');

    if (!searchInput || !filterButtons.length) {
        return;
    }

    let activeStatus = 'all';
    let activeOrder = 'desc';

    const normalizeText = (value) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es');

    const getRowTimestamp = (row) => {
        const dateText = row.cells[3]?.textContent.trim() || '';
        const [datePart, timePart = '00:00'] = dateText.split(/\s+/);
        const [day, month, year] = datePart.split('/').map(Number);
        const [hour = 0, minute = 0] = timePart.split(':').map(Number);
        const timestamp = new Date(year, month - 1, day, hour, minute).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const applyFilters = () => {
        const activePane = document.querySelector('#trasposContent .tab-pane.active');
        if (!activePane) {
            return;
        }

        activePane.querySelectorAll('.traspasos-table tbody').forEach((tbody) => {
            const dataRows = Array.from(tbody.querySelectorAll('tr'))
                .filter((row) => row.querySelector('.traspaso-estado'));
            dataRows.sort((firstRow, secondRow) => {
                const difference = getRowTimestamp(firstRow) - getRowTimestamp(secondRow);
                return activeOrder === 'asc' ? difference : -difference;
            });
            dataRows.forEach((row) => tbody.appendChild(row));
        });

        const query = normalizeText(searchInput.value.trim());
        const hasActiveFilters = Boolean(query) || activeStatus !== 'all';

        activePane.querySelectorAll('.traspasos-table tbody').forEach((tbody) => {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const dataRows = rows.filter((row) => row.querySelector('.traspaso-estado'));
            let visibleRows = 0;

            rows.forEach((row) => {
                const statusBadge = row.querySelector('.traspaso-estado');
                if (!statusBadge) {
                    row.hidden = hasActiveFilters;
                    return;
                }

                const statusClass = Array.from(statusBadge.classList)
                    .find((className) => className.startsWith('traspaso-estado-') && className !== 'traspaso-estado');
                const status = statusClass ? statusClass.replace('traspaso-estado-', '') : '';
                const matchesStatus = activeStatus === 'all' || status === activeStatus;
                const matchesSearch = !query || normalizeText(row.textContent).includes(query);
                row.hidden = !(matchesStatus && matchesSearch);

                if (!row.hidden) {
                    visibleRows += 1;
                }
            });

            let emptyRow = tbody.querySelector('.traspasos-filter-empty');
            if (!emptyRow) {
                emptyRow = document.createElement('tr');
                emptyRow.className = 'traspasos-filter-empty';
                emptyRow.hidden = true;
                const cell = document.createElement('td');
                cell.colSpan = 6;
                cell.textContent = 'No hay traspasos que coincidan con estos filtros.';
                emptyRow.appendChild(cell);
                tbody.appendChild(emptyRow);
            }

            emptyRow.hidden = !hasActiveFilters || visibleRows > 0;
        });
    };

    searchInput.addEventListener('input', applyFilters);

    filterButtons.forEach((button) => {
        if (button.hasAttribute('data-sort-order')) {
            return;
        }

        button.addEventListener('click', () => {
            activeStatus = button.dataset.statusFilter;
            filterButtons.forEach((filterButton) => {
                const isActive = filterButton === button;
                filterButton.classList.toggle('active', isActive);
                filterButton.setAttribute('aria-pressed', String(isActive));
            });
            applyFilters();
        });
    });

    sortButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeOrder = button.dataset.sortOrder;
            sortButtons.forEach((sortButton) => {
                const isActive = sortButton === button;
                sortButton.classList.toggle('active', isActive);
                sortButton.setAttribute('aria-pressed', String(isActive));
            });
            applyFilters();
        });
    });

    tabLinks.forEach((tabLink) => {
        tabLink.addEventListener('click', () => window.setTimeout(applyFilters, 0));
    });

    applyFilters();
}

function initializeCambiarEstado() {
    const botonesEstado = document.querySelectorAll('.cambiar-estado');
    botonesEstado.forEach(boton => {
        boton.addEventListener('click', cambiarEstadoTraspaso);
    });
}

function cambiarEstadoTraspaso(e) {
    e.preventDefault();
    const traspasoId = this.dataset.id;
    const nuevoEstado = this.dataset.estado;
    const boton = this;

    // Confirmación
    Swal.fire({
        title: '¿Está seguro?',
        text: `El estado se cambiará a "${nuevoEstado}"`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('estado', nuevoEstado);
            formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

            fetch(`/traspasos/${traspasoId}/cambiar-estado/`, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    Swal.fire(
                        '¡Éxito!',
                        `Estado actualizado a ${data.nuevo_estado}`,
                        'success'
                    ).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire('Error', data.error || 'Error al cambiar el estado', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire('Error', error.message, 'error');
            });
        }
    });
}

// Utilidad para formatear dinero
function formatearDinero(cantidad) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(cantidad);
}

// Utilidad para formatear fecha
function formatearFecha(fecha) {
    const opciones = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-CO', opciones);
}
