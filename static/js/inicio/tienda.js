/* ============================================================================
   TIENDA.JS - Tienda virtual con todos los productos y carrito
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const cartCount = document.getElementById('cartCount');
    const addButtons = Array.from(document.querySelectorAll('.btn-add'));

    const getCart = () => {
        try {
            return JSON.parse(localStorage.getItem('alicen_cart') || '{}');
        } catch {
            return {};
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        updateCartCount(cart);
    };

    const updateCartCount = (cart) => {
        const count = Object.values(cart).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        if (cartCount) {
            cartCount.textContent = count;
        }
    };

    const addItem = (button) => {
        const productId = button.dataset.productId;
        const nombre = button.dataset.productName;
        const precio = parseFloat(button.dataset.productPrice || '0');
        const foto = button.dataset.productImage;
        const stock = parseInt(button.dataset.productStock || '0', 10);

        if (!productId || !nombre || !precio || stock <= 0) {
            mostrarToast('No se puede agregar este producto al carrito.', 'error', 'Sin stock');
            return;
        }

        const cart = getCart();
        const key = String(productId);
        const current = cart[key] || {};
        const cantidad = Math.min(stock, (current.cantidad || 0) + 1);

        cart[key] = {
            id: productId,
            nombre,
            precio,
            cantidad,
            foto,
        };

        saveCart(cart);
        mostrarToast('Producto agregado al carrito.', 'success', nombre);
    };

    const mostrarToast = (mensaje, tipo = 'success', titulo = '') => {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        const iconClass = tipo === 'success' ? 'fa-check' : 'fa-exclamation-triangle';
        const titleText = titulo || (tipo === 'success' ? 'Correcto' : 'Atención');
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
            <div class="toast-text">
                <strong>${titleText}</strong>
                <small>${mensaje}</small>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 350);
        }, 2800);
    };

    addButtons.forEach(button => button.addEventListener('click', () => addItem(button)));    
    updateCartCount(getCart());

    const filtroToggle = document.querySelector('.tienda-filtro-toggle');
    const filtroClose = document.querySelector('.tienda-filtros-close');
    const filtroPanel = document.getElementById('tiendaFilters');
    const overlay = document.querySelector('.tienda-overlay');

    const toggleFilters = (open) => {
        if (!filtroPanel) return;
        filtroPanel.classList.toggle('open', open);
        document.body.classList.toggle('filtros-open', open);
        if (overlay) {
            overlay.classList.toggle('open', open);
        }
    };

    if (filtroToggle) {
        filtroToggle.addEventListener('click', () => toggleFilters(true));
    }
    if (filtroClose) {
        filtroClose.addEventListener('click', () => toggleFilters(false));
    }
    if (overlay) {
        overlay.addEventListener('click', () => toggleFilters(false));
    }
});
