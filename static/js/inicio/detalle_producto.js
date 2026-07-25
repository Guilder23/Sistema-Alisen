document.addEventListener('DOMContentLoaded', () => {
    const detailForm = document.getElementById('detailAddToCartForm');
    const quantityInput = document.getElementById('detailQuantity');
    const productId = document.getElementById('detailProductId')?.value;
    const productName = document.getElementById('detailProductName')?.value;
    const productPrice = parseFloat(document.getElementById('detailProductPrice')?.value || '0');
    const productImage = document.getElementById('detailProductImage')?.value;
    const stock = parseInt(quantityInput?.max || '0', 10);

    const cartCount = document.getElementById('cartCount');

    const getCart = () => {
        try { return JSON.parse(localStorage.getItem('alicen_cart') || '{}'); } catch { return {}; }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        updateCartCount(cart);
    };

    const updateCartCount = (cart) => {
        const count = Object.values(cart).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        if (cartCount) cartCount.textContent = count;
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

    const addToCart = (quantity) => {
        if (!productId || !productName || !productPrice || quantity < 1) return;
        const cart = getCart();
        const key = String(productId);
        const existing = cart[key] || {};
        const newQuantity = Math.min(stock, (existing.cantidad || 0) + quantity);
        cart[key] = { id: productId, nombre: productName, precio: productPrice, cantidad: newQuantity, foto: productImage };
        saveCart(cart);
        mostrarToast(`${quantity} unidad${quantity === 1 ? '' : 'es'} agregada${quantity === 1 ? '' : 's'} al carrito.`, 'success', productName);
    };

    detailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantity = parseInt(quantityInput.value || '1', 10);
        if (quantity < 1) {
            mostrarToast('Ingresa una cantidad válida.', 'error', 'Datos incorrectos');
            return;
        }
        if (quantity > stock) {
            mostrarToast(`La cantidad supera el stock disponible (${stock}).`, 'error', 'Stock insuficiente');
            return;
        }
        addToCart(quantity);
    });

    updateCartCount(getCart());
});
