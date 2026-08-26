/* ============================================================================
   CARRITO_MAYORISTA.JS - Lógica de carrito mayorista B2B y pedido WhatsApp
   ============================================================================ */

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
    const deliveryOptions = document.querySelectorAll('.delivery-option-card');
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
        } catch { 
            return {}; 
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem(key, JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        render();
    };

    const money = (value) => Number(value || 0).toFixed(2);

    const toast = (mensaje, tipo = 'success', titulo = '¡Mayorista!') => {
        const node = document.createElement('div');
        node.className = `toast-notification toast-${tipo}`;
        node.innerHTML = `
            <div class="toast-icon"><i class="fas fa-${tipo === 'success' ? 'check' : 'exclamation-triangle'}"></i></div>
            <div class="toast-text">
                <strong>${titulo}</strong>
                <small>${mensaje}</small>
            </div>
        `;
        document.body.appendChild(node);
        setTimeout(() => {
            node.classList.add('toast-hide');
            setTimeout(() => node.remove(), 350);
        }, 2800);
    };

    const render = () => {
        const cart = getCart();
        const list = Object.values(cart);

        if (!list.length) {
            if (content) {
                content.innerHTML = `
                    <div class="cart-empty text-center">
                        <i class="fas fa-boxes fa-3x mb-3 text-muted"></i>
                        <p>Tu carrito mayorista está vacío</p>
                        <small class="text-muted d-block mb-3">Agrega productos por mayor desde nuestro catálogo B2B.</small>
                        <a href="/tienda-mayorista/" class="btn btn-success btn-sm">
                            <i class="fas fa-boxes mr-1"></i> Explorar Catálogo Mayorista
                        </a>
                    </div>
                `;
            }
            if (totalNode) totalNode.textContent = '0.00';
            if (countNode) countNode.textContent = '0';
            if (showFormButton) showFormButton.disabled = true;
            return;
        }

        const htmlItems = list.map((item) => `
            <article class="cart-item mayorista-cart-item">
                <div class="cart-item-image">
                    <img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre}">
                </div>
                <div class="cart-item-main">
                    <div class="cart-item-header">
                        <strong>${item.nombre}</strong>
                        <div class="cart-item-price text-success font-weight-bold">
                            Bs ${money(item.precio)} <small class="text-muted">/unidad</small>
                        </div>
                        <small class="text-muted d-block"><i class="fas fa-layer-group mr-1"></i>Mínimo: ${item.unidades_por_mayor || 1} unid.</small>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-control" data-action="decrease" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" min="${item.unidades_por_mayor || 1}" step="${item.unidades_por_mayor || 1}" value="${item.cantidad}" data-id="${item.id}">
                        <button class="quantity-control" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-footer">
                        <div class="cart-item-total text-success">Bs ${money(item.cantidad * item.precio)}</div>
                        <button class="btn btn-outline-danger btn-sm remove-item" data-id="${item.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');

        if (content) content.innerHTML = htmlItems;
        if (countNode) countNode.textContent = String(list.reduce((sum, it) => sum + Number(it.cantidad || 0), 0));
        if (totalNode) totalNode.textContent = money(list.reduce((sum, it) => sum + Number(it.cantidad || 0) * Number(it.precio || 0), 0));
        if (showFormButton) showFormButton.disabled = false;

        // Steppers
        content.querySelectorAll('.quantity-control').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = String(btn.dataset.id);
                const isInc = btn.dataset.action === 'increase';
                const c = getCart();
                if (!c[id]) return;

                const step = Number(c[id].unidades_por_mayor || 1);
                const current = Number(c[id].cantidad || step);
                const max = Number(c[id].stock || 9999);
                const next = isInc ? current + step : current - step;

                if (next < step) return;
                if (next > max && max > 0) {
                    toast(`Stock máximo: ${max} unidades.`, 'error', 'Límite');
                    return;
                }

                c[id].cantidad = next;
                saveCart(c);
            });
        });

        content.querySelectorAll('.quantity-input').forEach((input) => {
            input.addEventListener('change', () => {
                const id = String(input.dataset.id);
                const c = getCart();
                if (!c[id]) return;

                const step = Number(c[id].unidades_por_mayor || 1);
                const max = Number(c[id].stock || 9999);
                let val = parseInt(input.value, 10);
                if (isNaN(val) || val < step) val = step;
                if (val > max && max > 0) val = max;

                input.value = val;
                c[id].cantidad = val;
                saveCart(c);
            });
        });

        // Eliminar
        content.querySelectorAll('.remove-item').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = String(btn.dataset.id);
                const c = getCart();
                delete c[id];
                saveCart(c);
                toast('Producto eliminado del pedido mayorista.', 'success', 'Eliminado');
            });
        });
    };

    // Selección de Entrega Mayorista
    deliveryOptions.forEach((card) => {
        card.addEventListener('click', () => {
            deliveryOptions.forEach((c) => c.classList.remove('active'));
            card.classList.add('active');
            selectedDelivery = card.dataset.delivery || '';
            if (continueDeliveryButton) {
                continueDeliveryButton.disabled = !selectedDelivery;
            }
        });
    });

    continueDeliveryButton?.addEventListener('click', () => {
        if (!selectedDelivery) return;
        $(deliveryModal).modal('hide');
        configureFields();
        $(customerModal).modal('show');
    });

    const configureFields = () => {
        const isDep = selectedDelivery === 'department';
        const isDel = selectedDelivery === 'delivery';

        const phoneGroup = document.getElementById('customerPhoneGroup');
        const depGroup = document.getElementById('departmentGroup');
        const provGroup = document.getElementById('provinceGroup');
        const locGroup = document.getElementById('customerLocationGroup');

        if (phoneGroup) phoneGroup.style.display = (isDep || isDel) ? 'block' : 'none';
        if (depGroup) depGroup.style.display = isDep ? 'block' : 'none';
        if (provGroup) provGroup.style.display = isDep ? 'block' : 'none';
        if (locGroup) locGroup.style.display = isDel ? 'block' : 'none';
    };

    // Enviar WhatsApp Mayorista
    checkoutForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const list = Object.values(getCart());
        if (!list.length) {
            toast('Tu carrito mayorista está vacío.', 'error', 'Error');
            return;
        }

        const name = document.getElementById('customerName')?.value.trim();
        const location = document.getElementById('customerLocation')?.value.trim() || '';
        const phone = document.getElementById('customerPhone')?.value.trim() || '';
        const department = document.getElementById('customerDepartment')?.value.trim() || '';
        const province = document.getElementById('customerProvince')?.value.trim() || '';

        if (!name) {
            toast('Por favor, ingresa tu nombre o razón social.', 'error', 'Datos requeridos');
            return;
        }

        const deliveryName = selectedDelivery === 'delivery' 
            ? '🚛 Entrega en Negocio / Almacén' 
            : (selectedDelivery === 'department' ? '📦 Envío Interdepartamental (Flota/Transporte)' : '🏬 Retiro en Depósito Central');

        const productLines = list.map((item, idx) => {
            return `${idx + 1}. *${item.nombre}*\n   Cant: ${item.cantidad} unid. x Bs ${money(item.precio)} = Bs ${money(item.cantidad * item.precio)}`;
        });

        const totalAmount = money(list.reduce((sum, item) => sum + Number(item.cantidad || 0) * Number(item.precio || 0), 0));

        let extraDetails = `📍 *Modalidad de Entrega:* ${deliveryName}\n`;
        if (phone) extraDetails += `📞 *Teléfono / WhatsApp:* ${phone}\n`;
        if (location && selectedDelivery === 'delivery') extraDetails += `📌 *Ubicación / Maps:* ${location}\n`;
        if (selectedDelivery === 'department') {
            extraDetails += `🗺️ *Destino:* ${department}, ${province}\n`;
        }

        const message = encodeURIComponent(
            `📦 *NUEVO PEDIDO MAYORISTA (B2B)*\n\n` +
            `🏢 *CLIENTE / NEGOCIO:* ${name}\n` +
            extraDetails +
            `\n📋 *PRODUCTOS POR MAYOR:*\n` +
            `${productLines.join('\n')}\n\n` +
            `💰 *TOTAL MAYORISTA:* Bs ${totalAmount}\n\n` +
            `Por favor, solicito confirmación de stock por lote y cotización para el despacho. ¡Gracias!`
        );

        window.open(`https://wa.me/59168504229?text=${message}`, '_blank');
        $(customerModal).modal('hide');
    });

    clearButton?.addEventListener('click', () => {
        const list = Object.values(getCart());
        if (!list.length) {
            toast('Tu carrito mayorista ya está vacío.', 'error', 'Atención');
            return;
        }
        if (!confirm('¿Deseas vaciar el pedido mayorista?')) return;
        localStorage.removeItem(key);
        window.dispatchEvent(new Event('cartUpdated'));
        render();
        toast('Se ha vaciado el carrito mayorista.', 'success', 'Vacío');
    });

    render();
});
