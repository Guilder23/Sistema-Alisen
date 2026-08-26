/* ============================================================================
   TIENDA_MAYORISTA.JS - Lógica de catálogo mayorista y filtros
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const btnOpenMayoristaFilters = document.getElementById('btnOpenMayoristaFilters');
    const btnCloseMayoristaFilters = document.getElementById('btnCloseMayoristaFilters');
    const tiendaMayoristaFilters = document.getElementById('tiendaMayoristaFilters');
    const tiendaMayoristaOverlay = document.getElementById('tiendaMayoristaOverlay');

    const toggleMayoristaFilters = (open) => {
        if (!tiendaMayoristaFilters) return;
        tiendaMayoristaFilters.classList.toggle('open', open);
        document.body.classList.toggle('filtros-open', open);
        if (tiendaMayoristaOverlay) {
            tiendaMayoristaOverlay.classList.toggle('open', open);
        }
    };

    if (btnOpenMayoristaFilters) {
        btnOpenMayoristaFilters.addEventListener('click', () => toggleMayoristaFilters(true));
    }
    if (btnCloseMayoristaFilters) {
        btnCloseMayoristaFilters.addEventListener('click', () => toggleMayoristaFilters(false));
    }
    if (tiendaMayoristaOverlay) {
        tiendaMayoristaOverlay.addEventListener('click', () => toggleMayoristaFilters(false));
    }
});
