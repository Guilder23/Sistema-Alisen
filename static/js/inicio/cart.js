document.addEventListener('DOMContentLoaded', () => {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearCartBtn = document.getElementById('clearCartBtn');

    const getCart = () => {
        try {
            return JSON.parse(localStorage.getItem('alicen_cart') || '{}');
        } catch {
            return {};
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        renderCart();
    };

    const getCartItems = () => Object.values(getCart());

    const formatCurrency = (value) => Number(value).toFixed(2);

    const calculateTotal = (items) => items.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

    const renderEmpty = () => {
        cartContent.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-bag"></i>
                <p>Tu carrito está vacío.</p>
                <small>Agrega productos desde el catálogo y vuelve para enviar tu pedido por WhatsApp.</small>
            </div>
        `;
        cartTotal.textContent = '0.00';
    };

    const renderCart = () => {
        const items = getCartItems();
        if (!items.length) {
            renderEmpty();
            return;
        }

        cartContent.innerHTML = items.map(item => `
            <article class="cart-item">
                <img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre}">
                <div class="cart-item-body">
                    <strong>${item.nombre}</strong>
                    <span>Bs ${formatCurrency(item.precio)} c/u</span>
                    <div class="cart-item-quantity">
                        <button class="quantity-control" data-action="decrease" data-id="${item.id}">-</button>
                        <span>${item.cantidad}</span>
                        <button class="quantity-control" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="cart-item-meta">
                    <strong>Bs ${formatCurrency(item.cantidad * item.precio)}</strong>
                    <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </article>
        `).join('');

        cartTotal.textContent = formatCurrency(calculateTotal(items));

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
                delete cart[id];
                saveCart(cart);
            });
        });
    };

    checkoutButton?.addEventListener('click', () => {
        const items = getCartItems();
        if (!items.length) {
            alert('Agrega productos al carrito antes de enviar el pedido.');
            return;
        }

        const lines = items.map(item => {
            const label = item.en_oferta ? `${item.nombre} (OFERTA)` : item.nombre;
            return `${label} x ${item.cantidad} = Bs ${formatCurrency(item.cantidad * item.precio)}`;
        });
        const total = formatCurrency(calculateTotal(items));
        const message = encodeURIComponent(`Hola, quiero hacer un pedido:\n\n${lines.join('\n')}\n\nTotal: Bs ${total}\n\nPor favor, confirmen disponibilidad y envío.`);
        const phone = checkoutButton?.dataset.phone || '';
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    });

    clearCartBtn?.addEventListener('click', () => {
        if (!confirm('¿Deseas vaciar el carrito?')) return;
        localStorage.removeItem('alicen_cart');
        renderCart();
    });

    renderCart();
});
