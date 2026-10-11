/* ============================================================================
   TIENDA_MAYORISTA.JS - Lógica de catálogo mayorista y filtros
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const addCartButtons = Array.from(document.querySelectorAll('.btn-add-mayorista'));
    const whatsappButtons = Array.from(document.querySelectorAll('.btn-whatsapp-mayorista'));

    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `<div class="toast-icon"><i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i></div><div class="toast-text"><strong>${type === 'success' ? 'Pedido agregado' : 'Atención'}</strong><small>${message}</small></div>`;
        document.body.appendChild(toast);
        window.setTimeout(() => {
            toast.classList.add('toast-hide');
            window.setTimeout(() => toast.remove(), 350);
        }, 2800);
    };

    addCartButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const id = String(button.dataset.productId || '');
            const minimum = Math.max(1, parseInt(button.dataset.productMinimum || '1', 10));
            const stock = parseInt(button.dataset.productStock || '0', 10);
            const price = Number((button.dataset.productPrice || '0').replace(',', '.'));

            if (!id || !price || (stock > 0 && minimum > stock)) {
                showToast('No hay stock suficiente para el mínimo mayorista.', 'error');
                return;
            }

            let cart = {};
            try {
                cart = JSON.parse(localStorage.getItem('alicen_cart_mayorista') || '{}');
            } catch {
                cart = {};
            }

            const current = cart[id] || {};
            const quantity = Math.max(minimum, Number(current.cantidad || 0) + minimum);
            if (stock > 0 && quantity > stock) {
                showToast(`Stock máximo disponible: ${stock} unidades.`, 'error');
                return;
            }

            cart[id] = {
                id,
                nombre: button.dataset.productName || 'Producto',
                precio: price,
                cantidad: quantity,
                foto: button.dataset.productImage || '',
                stock: stock || 9999,
                unidades_por_mayor: minimum
            };
            localStorage.setItem('alicen_cart_mayorista', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
            showToast(`${cart[id].nombre} se agregó al carrito mayorista.`);

            const original = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
            window.setTimeout(() => { button.innerHTML = original; }, 800);
        });
    });

    whatsappButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const phone = (button.dataset.whatsappNumber || '59168504229').replace(/\D/g, '');
            const name = button.dataset.productName || 'Producto';
            const price = (button.dataset.productPrice || '0.00').replace(',', '.');
            const minimum = button.dataset.productMinimum || '1';
            const message = `Hola, quiero consultar por ${name} para compra mayorista. Precio: Bs ${price} por unidad. Mínimo: ${minimum} unidades. ¿Me confirman disponibilidad y cómo coordinamos el pedido?`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
        });
    });

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
