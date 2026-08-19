document.addEventListener('DOMContentLoaded', () => {
    const key = 'alicen_cart_mayorista';
    const content = document.getElementById('cartContent');
    const totalNode = document.getElementById('cartTotal');
    const countNode = document.getElementById('cartItemCount');
    const checkout = document.getElementById('checkoutForm');
    const clearButton = document.getElementById('clearCartBtn');
    const getCart = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
    const saveCart = (cart) => { localStorage.setItem(key, JSON.stringify(cart)); render(); };
    const money = (value) => Number(value || 0).toFixed(2);
    const items = () => Object.values(getCart());
    const render = () => {
        const cart = getCart();
        const list = Object.values(cart);
        if (!list.length) {
            content.innerHTML = '<div class="text-center py-5 text-muted"><i class="fas fa-box-open fa-2x mb-3"></i><p>Tu carrito mayorista esta vacio.</p><a class="btn btn-outline-success btn-sm" href="/tienda-mayorista/">Ver catalogo mayorista</a></div>';
            totalNode.textContent = '0.00'; countNode.textContent = '0'; return;
        }
        content.innerHTML = list.map((item) => `<article class="cart-item mayorista-cart-item"><div class="cart-item-image"><img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre}"></div><div class="cart-item-main"><div class="cart-item-header"><strong>${item.nombre}</strong><div class="cart-item-price">Bs ${money(item.precio)} mayorista</div></div><div class="small text-success mb-2"><i class="fas fa-boxes mr-1"></i>Minimo: ${item.unidades_por_mayor || 1} unidades</div><div class="cart-item-controls"><button class="btn btn-sm btn-light quantity-control" data-action="decrease" data-id="${item.id}">-</button><input type="number" class="form-control quantity-input" min="${item.unidades_por_mayor || 1}" value="${item.cantidad}" data-id="${item.id}"><button class="btn btn-sm btn-light quantity-control" data-action="increase" data-id="${item.id}">+</button></div><div class="cart-item-footer"><div class="cart-item-total">Total: Bs ${money(item.cantidad * item.precio)}</div><button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></div></div></article>`).join('');
        countNode.textContent = list.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
        totalNode.textContent = money(list.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.precio || 0), 0));
        content.querySelectorAll('.quantity-control').forEach((button) => button.addEventListener('click', () => changeQuantity(button.dataset.id, button.dataset.action === 'increase' ? 1 : -1)));
        content.querySelectorAll('.quantity-input').forEach((input) => input.addEventListener('change', () => setQuantity(input.dataset.id, input.value)));
        content.querySelectorAll('.remove-item').forEach((button) => button.addEventListener('click', () => { const next = getCart(); delete next[button.dataset.id]; saveCart(next); }));
    };
    const setQuantity = (id, value) => { const cart = getCart(); if (!cart[id]) return; const minimum = Number(cart[id].unidades_por_mayor || 1); const stock = Number(cart[id].stock || Infinity); cart[id].cantidad = Math.min(stock, Math.max(minimum, parseInt(value, 10) || minimum)); saveCart(cart); };
    const changeQuantity = (id, delta) => { const cart = getCart(); if (!cart[id]) return; setQuantity(id, Number(cart[id].cantidad) + delta * Number(cart[id].unidades_por_mayor || 1)); };
    clearButton?.addEventListener('click', () => { if (items().length && confirm('Deseas vaciar el carrito mayorista?')) { localStorage.removeItem(key); render(); } });
    checkout?.addEventListener('submit', (event) => { event.preventDefault(); const list = items(); if (!list.length) return; const name = document.getElementById('customerName').value.trim(); const phone = document.getElementById('customerPhone').value.trim(); const address = document.getElementById('customerAddress').value.trim(); if (!name || !phone || !address) return; const lines = list.map((item) => `${item.nombre} x ${item.cantidad} = Bs ${money(item.cantidad * item.precio)}`); const total = money(list.reduce((sum, item) => sum + item.cantidad * item.precio, 0)); const message = encodeURIComponent(`Hola, quiero realizar un pedido MAYORISTA.\n\nCliente: ${name}\nTelefono: ${phone}\nDireccion: ${address}\n\n${lines.join('\n')}\n\nTotal mayorista: Bs ${total}`); window.open(`https://wa.me/68504229?text=${message}`, '_blank'); });
    render();
});
