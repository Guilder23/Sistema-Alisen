document.addEventListener('DOMContentLoaded', () => {
    const key = 'alicen_cart_mayorista';
    const content = document.getElementById('cartContent');
    const totalNode = document.getElementById('cartTotal');
    const countNode = document.getElementById('cartItemCount');
    const showFormButton = document.getElementById('showFormButton');
    const checkoutForm = document.getElementById('checkoutForm');
    const clearButton = document.getElementById('clearCartBtn');
    const deliveryModal = document.getElementById('deliveryModal');
    const customerModal = document.getElementById('customerModal');
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    const continueDeliveryButton = document.getElementById('continueDeliveryButton');
    const productPrices = JSON.parse(document.getElementById('preciosMayoristas')?.textContent || '{}');
    let selectedDelivery = '';

    const getCart = () => {
        try {
            const cart = JSON.parse(localStorage.getItem(key) || '{}');
            Object.values(cart).forEach((item) => {
                const currentPrice = Number(productPrices[String(item.id)] || 0);
                if (currentPrice > 0 && Number(item.precio || 0) <= 0) item.precio = currentPrice;
            });
            localStorage.setItem(key, JSON.stringify(cart));
            return cart;
        } catch { return {}; }
    };
    const items = () => Object.values(getCart());
    const money = (value) => Number(value || 0).toFixed(2);
    const saveCart = (cart) => { localStorage.setItem(key, JSON.stringify(cart)); render(); };
    const toast = (message, title = 'Atención', type = 'error') => {
        const node = document.createElement('div');
        node.className = `toast-notification toast-${type}`;
        node.innerHTML = `<div class="toast-icon"><i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i></div><div class="toast-text"><strong>${title}</strong><small>${message}</small></div>`;
        document.body.appendChild(node);
        setTimeout(() => { node.classList.add('toast-hide'); setTimeout(() => node.remove(), 350); }, 2800);
    };
    const render = () => {
        const list = items();
        if (!list.length) {
            content.innerHTML = '<div class="cart-empty text-center py-4"><i class="fas fa-box-open fa-2x text-muted"></i><p>Tu carrito mayorista está vacío.</p><small>Agrega productos desde el catálogo mayorista.</small></div>';
            totalNode.textContent = '0.00'; countNode.textContent = '0'; showFormButton.disabled = true; return;
        }
        content.innerHTML = list.map((item) => `<article class="cart-item mayorista-cart-item"><div class="cart-item-image"><img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre}"></div><div class="cart-item-main"><div class="cart-item-header"><strong>${item.nombre}</strong><div class="cart-item-price">Precio unitario mayorista: Bs ${money(item.precio)}</div></div><div class="small text-success mb-2"><i class="fas fa-boxes mr-1"></i>Mínimo: ${item.unidades_por_mayor || 1} unidades</div><div class="cart-item-controls"><button class="btn btn-sm btn-light quantity-control" data-action="decrease" data-id="${item.id}">-</button><input type="number" class="form-control quantity-input" min="${item.unidades_por_mayor || 1}" step="${item.unidades_por_mayor || 1}" value="${item.cantidad}" data-id="${item.id}"><button class="btn btn-sm btn-light quantity-control" data-action="increase" data-id="${item.id}">+</button></div><div class="cart-item-footer"><div class="cart-item-total">Total del producto: Bs ${money(item.cantidad * item.precio)}</div><button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></div></div></article>`).join('');
        countNode.textContent = String(list.reduce((sum, item) => sum + Number(item.cantidad || 0), 0));
        totalNode.textContent = money(list.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.precio || 0), 0));
        showFormButton.disabled = false;
        content.querySelectorAll('.quantity-control').forEach((button) => button.addEventListener('click', () => changeQuantity(button.dataset.id, button.dataset.action === 'increase' ? 1 : -1)));
        content.querySelectorAll('.quantity-input').forEach((input) => input.addEventListener('change', () => setQuantity(input.dataset.id, input.value)));
        content.querySelectorAll('.remove-item').forEach((button) => button.addEventListener('click', () => { const cart = getCart(); delete cart[button.dataset.id]; saveCart(cart); }));
    };
    const setQuantity = (id, value) => { const cart = getCart(); if (!cart[id]) return; const minimum = Number(cart[id].unidades_por_mayor || 1); const stock = Number(cart[id].stock || Infinity); cart[id].cantidad = Math.min(stock, Math.max(minimum, parseInt(value, 10) || minimum)); saveCart(cart); };
    const changeQuantity = (id, delta) => { const cart = getCart(); if (!cart[id]) return; setQuantity(id, Number(cart[id].cantidad) + delta * Number(cart[id].unidades_por_mayor || 1)); };

    deliveryOptions.forEach((option) => option.addEventListener('click', () => { deliveryOptions.forEach((item) => item.classList.remove('active')); option.classList.add('active'); selectedDelivery = option.dataset.delivery || ''; continueDeliveryButton.disabled = !selectedDelivery; }));
    continueDeliveryButton?.addEventListener('click', () => { if (!selectedDelivery) return; $(deliveryModal).modal('hide'); configureFields(); $(customerModal).modal('show'); });
    const configureFields = () => {
        const department = selectedDelivery === 'department';
        const locationRequired = selectedDelivery === 'delivery';
        document.getElementById('customerLocationGroup').style.display = locationRequired ? 'block' : 'none';
        document.getElementById('customerPhoneGroup').style.display = department ? 'block' : 'none';
        document.getElementById('departmentGroup').style.display = department ? 'block' : 'none';
        document.getElementById('provinceGroup').style.display = department ? 'block' : 'none';
        document.getElementById('customerLocation').required = locationRequired;
        document.getElementById('customerPhone').required = department; document.getElementById('customerDepartment').required = department; document.getElementById('customerProvince').required = department;
        document.getElementById('deliveryNote').style.display = locationRequired ? 'block' : 'none';
    };
    showFormButton?.addEventListener('click', (event) => { if (!items().length) { event.preventDefault(); toast('Agrega productos antes de enviar el pedido.'); } });
    checkoutForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const list = items(); const name = document.getElementById('customerName').value.trim(); const location = document.getElementById('customerLocation').value.trim(); const phone = document.getElementById('customerPhone').value.trim(); const department = document.getElementById('customerDepartment').value.trim(); const province = document.getElementById('customerProvince').value.trim();
        if (!name || !selectedDelivery || (selectedDelivery === 'delivery' && !location) || (selectedDelivery === 'department' && (!phone || !department || !province))) { toast('Completa todos los datos requeridos.'); return; }
        const lines = list.map((item) => `${item.nombre} x ${item.cantidad} = Bs ${money(item.cantidad * item.precio)}`); const delivery = selectedDelivery === 'delivery' ? 'Delivery' : selectedDelivery === 'department' ? 'Envío a departamento' : 'Recoger en tienda'; const locationLine = selectedDelivery === 'delivery' ? `Ubicación (Google Maps): ${location}\n` : ''; const departmentLine = selectedDelivery === 'department' ? `Departamento: ${department}\nProvincia: ${province}\nTeléfono de referencia: ${phone}\n` : ''; const total = money(list.reduce((sum, item) => sum + Number(item.cantidad) * Number(item.precio), 0));
        const message = encodeURIComponent(`Hola, quiero hacer un pedido MAYORISTA.\n\nDATOS DEL CLIENTE:\nNombre: ${name}\n${locationLine}${departmentLine}Opción de entrega: ${delivery}\n\nPEDIDO MAYORISTA:\n${lines.join('\n')}\n\nTotal mayorista: Bs ${total}`);
        window.open(`https://wa.me/68504229?text=${message}`, '_blank'); $(customerModal).modal('hide');
    });
    clearButton?.addEventListener('click', () => { if (items().length && confirm('¿Deseas vaciar el carrito mayorista?')) { localStorage.removeItem(key); render(); } });
    customerModal?.addEventListener('hidden.bs.modal', () => { checkoutForm.reset(); selectedDelivery = ''; deliveryOptions.forEach((item) => item.classList.remove('active')); continueDeliveryButton.disabled = true; });
    render();
});
