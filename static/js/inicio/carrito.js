document.addEventListener('DOMContentLoaded', () => {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    const cartItemCount = document.getElementById('cartItemCount');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearCartBtn = document.getElementById('clearCartBtn');

    const getCart = () => { try { return JSON.parse(localStorage.getItem('alicen_cart') || '{}'); } catch { return {}; } };
    const saveCart = (cart) => { localStorage.setItem('alicen_cart', JSON.stringify(cart)); renderCart(); };
    const getCartItems = () => Object.values(getCart());
    const formatCurrency = (value) => Number(value).toFixed(2);
    const calculateTotal = (items) => items.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

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

    const renderEmpty = () => {
        cartContent.innerHTML = `
            <div class="cart-empty text-center py-4">
                <i class="fas fa-shopping-bag fa-2x text-muted"></i>
                <p>Tu carrito está vacío.</p>
                <small>Agrega productos desde el catálogo y vuelve para enviar tu pedido por WhatsApp.</small>
            </div>
        `;
        cartTotal.textContent = '0.00';
        if (cartItemCount) cartItemCount.textContent = '0';
    };

    const renderCart = () => {
        const items = getCartItems();
        const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);
        if (!items.length) { renderEmpty(); return; }

        const htmlItems = items.map(item => `
            <article class="cart-item row align-items-center">
                <div class="col-auto"><img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre}"></div>
                <div class="col cart-item-body">
                    <strong>${item.nombre}</strong>
                    <div class="small">Bs ${formatCurrency(item.precio)} c/u</div>
                    <div class="cart-item-quantity mt-2">
                        <button class="btn btn-sm btn-light quantity-control" data-action="decrease" data-id="${item.id}">-</button>
                        <span class="mx-2">${item.cantidad}</span>
                        <button class="btn btn-sm btn-light quantity-control" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="col-auto cart-item-meta text-right">
                    <strong>Bs ${formatCurrency(item.cantidad * item.precio)}</strong>
                    <div><button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></div>
                </div>
            </article>
        `).join('');

        cartContent.innerHTML = htmlItems;
        cartTotal.textContent = formatCurrency(calculateTotal(items));
        if (cartItemCount) cartItemCount.textContent = String(totalItems);

        cartContent.querySelectorAll('.quantity-control').forEach(button => {
            button.addEventListener('click', () => {
                const cart = getCart();
                const id = button.dataset.id;
                const action = button.dataset.action;
                if (!cart[id]) return;
                const current = cart[id].cantidad;
                const next = action === 'increase' ? current + 1 : current - 1;
                if (next < 1) return;
                cart[id].cantidad = next;
                saveCart(cart);
            });
        });

        cartContent.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                const cart = getCart();
                const id = button.dataset.id;
                const item = cart[id];
                if (!item) return;
                delete cart[id];
                saveCart(cart);
                mostrarToast('Producto eliminado del carrito.', 'success', item.nombre);
            });
        });
    };

    checkoutButton?.addEventListener('click', () => {
        const items = getCartItems();
        if (!items.length) {
            mostrarToast('Agrega productos al carrito antes de enviar el pedido.', 'error', 'Carrito vacío');
            return;
        }

        const lines = items.map(item => `${item.nombre} x ${item.cantidad} = Bs ${formatCurrency(item.cantidad * item.precio)}`);
        const total = formatCurrency(calculateTotal(items));
        const message = encodeURIComponent(`Hola, quiero hacer un pedido:\n\n${lines.join('\n')}\n\nTotal: Bs ${total}\n\nPor favor, confirmen disponibilidad y envío.`);
        const phone = checkoutButton?.dataset.phone || '';
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    });

    clearCartBtn?.addEventListener('click', () => {
        const items = getCartItems();
        if (!items.length) {
            mostrarToast('Tu carrito ya está vacío.', 'error', 'Sin productos');
            return;
        }
        if (!confirm('¿Deseas vaciar el carrito?')) return;
        localStorage.removeItem('alicen_cart');
        renderCart();
        mostrarToast('El carrito se ha vaciado correctamente.', 'success', 'Carrito vacío');
    });

    renderCart();
});
