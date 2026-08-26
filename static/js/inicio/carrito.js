/* ============================================================================
   CARRITO.JS - Lógica de carrito minorista y checkout por WhatsApp
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    const cartItemCount = document.getElementById('cartItemCount');
    const showFormButton = document.getElementById('showFormButton');
    const checkoutForm = document.getElementById('checkoutForm');
    const submitOrderButton = document.getElementById('submitOrderButton');
    const deliveryModal = document.getElementById('deliveryModal');
    const deliveryOptions = document.querySelectorAll('.delivery-option-card');
    const continueDeliveryButton = document.getElementById('continueDeliveryButton');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const customerModal = document.getElementById('customerModal');

    let selectedDelivery = '';

    const getCart = () => {
        try { 
            return JSON.parse(localStorage.getItem('alicen_cart') || '{}'); 
        } catch { 
            return {}; 
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        renderCart();
    };

    const formatCurrency = (value) => Number(value || 0).toFixed(2);
    const calculateTotal = (items) => items.reduce((sum, item) => sum + (Number(item.cantidad || 0) * Number(item.precio || 0)), 0);

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
        if (!cartContent) return;
        cartContent.innerHTML = `
            <div class="cart-empty text-center py-5">
                <i class="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
                <p>Tu carrito está vacío</p>
                <small class="text-muted d-block mb-3">Agrega tus productos favoritos desde la tienda y vuelve para completar tu pedido.</small>
                <a href="/tienda/" class="btn btn-primary btn-sm">
                    <i class="fas fa-store mr-1"></i> Explorar Catálogo
                </a>
            </div>
        `;
        if (cartTotal) cartTotal.textContent = '0.00';
        if (cartItemCount) cartItemCount.textContent = '0';
        if (showFormButton) showFormButton.disabled = true;
    };

    const renderCart = () => {
        const cart = getCart();
        const entries = Object.entries(cart);

        if (!entries.length) {
            renderEmpty();
            return;
        }

        const items = entries.map(([key, item]) => ({ ...item, _key: key }));
        const totalItems = items.reduce((sum, i) => sum + (Number(i.cantidad) || 0), 0);

        const htmlItems = items.map(item => `
            <article class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre || 'Producto'}">
                </div>
                <div class="cart-item-main">
                    <div class="cart-item-header">
                        <strong>${item.nombre || 'Producto'}</strong>
                        <div class="cart-item-price">Bs ${formatCurrency(item.precio)} c/u</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-control" data-action="decrease" data-cart-key="${item._key}" aria-label="Disminuir">-</button>
                        <input type="number" class="quantity-input" min="1" max="${item.stock || 999}" value="${item.cantidad}" data-cart-key="${item._key}">
                        <button class="quantity-control" data-action="increase" data-cart-key="${item._key}" aria-label="Aumentar">+</button>
                    </div>
                    <div class="cart-item-footer">
                        <div class="cart-item-total">Bs ${formatCurrency(item.cantidad * item.precio)}</div>
                        <button class="btn btn-outline-danger btn-sm remove-item" data-cart-key="${item._key}" title="Eliminar del carrito" aria-label="Eliminar del carrito">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');

        cartContent.innerHTML = htmlItems;
        if (cartTotal) cartTotal.textContent = formatCurrency(calculateTotal(items));
        if (cartItemCount) cartItemCount.textContent = String(totalItems);
        if (showFormButton) showFormButton.disabled = false;

        // Eventos Steppers
        cartContent.querySelectorAll('.quantity-control').forEach(button => {
            button.addEventListener('click', () => {
                const key = String(button.dataset.cartKey);
                const action = button.dataset.action;
                const currentCart = getCart();
                if (!currentCart[key]) return;

                const currentQty = Number(currentCart[key].cantidad) || 1;
                const maxStock = Number(currentCart[key].stock) || 999;
                const nextQty = action === 'increase' ? currentQty + 1 : currentQty - 1;

                if (nextQty < 1) return;
                if (nextQty > maxStock && maxStock > 0) {
                    mostrarToast(`Stock máximo disponible: ${maxStock} unidades.`, 'error', 'Stock límite');
                    return;
                }

                currentCart[key].cantidad = nextQty;
                saveCart(currentCart);
            });
        });

        cartContent.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const key = String(input.dataset.cartKey);
                const currentCart = getCart();
                if (!currentCart[key]) return;

                const maxStock = Number(currentCart[key].stock) || 999;
                let nextVal = parseInt(input.value, 10);
                if (isNaN(nextVal) || nextVal < 1) nextVal = 1;
                if (nextVal > maxStock && maxStock > 0) {
                    nextVal = maxStock;
                    mostrarToast(`Stock máximo: ${maxStock} unidades.`, 'error', 'Stock límite');
                }

                input.value = nextVal;
                currentCart[key].cantidad = nextVal;
                saveCart(currentCart);
            });
        });

        // Eventos Eliminar
        cartContent.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', () => {
                const key = String(button.dataset.cartKey);
                const currentCart = getCart();
                const item = currentCart[key];
                const itemName = item ? item.nombre : 'Producto';

                delete currentCart[key];
                saveCart(currentCart);
                mostrarToast(`Se eliminó "${itemName}" del carrito.`, 'success', 'Producto eliminado');
            });
        });
    };

    // Selección de Entrega
    deliveryOptions.forEach(card => {
        card.addEventListener('click', () => {
            deliveryOptions.forEach(item => item.classList.remove('active'));
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
        configureCustomerFields();
        $(customerModal).modal('show');
    });

    const configureCustomerFields = () => {
        const isDepartment = selectedDelivery === 'department';
        const isDelivery = selectedDelivery === 'delivery';

        const phoneGroup = document.getElementById('customerPhoneGroup');
        const addressGroup = document.getElementById('customerAddressGroup');
        const departmentRow = document.getElementById('departmentRow');
        const phoneInput = document.getElementById('customerPhone');
        const addressInput = document.getElementById('customerAddress');
        const departmentInput = document.getElementById('customerDepartment');
        const provinceInput = document.getElementById('customerProvince');

        if (phoneGroup) phoneGroup.style.display = (isDepartment || isDelivery) ? 'block' : 'none';
        if (addressGroup) addressGroup.style.display = (isDelivery || isDepartment) ? 'block' : 'none';
        if (departmentRow) departmentRow.style.display = isDepartment ? 'flex' : 'none';

        if (phoneInput) phoneInput.required = (isDepartment || isDelivery);
        if (addressInput) addressInput.required = (isDelivery || isDepartment);
        if (departmentInput) departmentInput.required = isDepartment;
        if (provinceInput) provinceInput.required = isDepartment;
    };

    // Envío de Formulario por WhatsApp
    checkoutForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const items = Object.values(getCart());
        if (!items.length) {
            mostrarToast('Tu carrito está vacío.', 'error', 'Error');
            return;
        }

        const customerName = document.getElementById('customerName')?.value.trim();
        const customerPhone = document.getElementById('customerPhone')?.value.trim() || '';
        const customerAddress = document.getElementById('customerAddress')?.value.trim() || '';
        const customerDepartment = document.getElementById('customerDepartment')?.value.trim() || '';
        const customerProvince = document.getElementById('customerProvince')?.value.trim() || '';

        if (!customerName) {
            mostrarToast('Por favor, ingresa tu nombre completo.', 'error', 'Datos requeridos');
            return;
        }

        const deliveryName = selectedDelivery === 'delivery' 
            ? '🛵 Delivery Local a Domicilio' 
            : (selectedDelivery === 'department' ? '📦 Envío Interdepartamental' : '🏬 Recoger en Tienda / Sucursal');

        const productLines = items.map((item, idx) => {
            const offerTag = item.en_oferta ? ' (OFERTA)' : '';
            return `${idx + 1}. *${item.nombre}${offerTag}*\n   Cant: ${item.cantidad} x Bs ${formatCurrency(item.precio)} = Bs ${formatCurrency(item.cantidad * item.precio)}`;
        });

        const totalAmount = formatCurrency(calculateTotal(items));

        let extraDetails = `📍 *Opción de Entrega:* ${deliveryName}\n`;
        if (customerPhone) extraDetails += `📞 *Teléfono Ref:* ${customerPhone}\n`;
        if (customerAddress) extraDetails += `🏠 *Dirección:* ${customerAddress}\n`;
        if (selectedDelivery === 'department') {
            extraDetails += `🗺️ *Destino:* ${customerDepartment}, ${customerProvince}\n`;
        }

        const message = encodeURIComponent(
            `🛒 *NUEVO PEDIDO - TIENDA VIRTUAL*\n\n` +
            `👤 *CLIENTE:* ${customerName}\n` +
            extraDetails +
            `\n📋 *DETALLE DEL PEDIDO:*\n` +
            `${productLines.join('\n')}\n\n` +
            `💰 *TOTAL PRODUCTOS:* Bs ${totalAmount}\n\n` +
            `Por favor, confirmen disponibilidad de stock y datos para realizar el pago y despacho. ¡Muchas gracias!`
        );

        const targetPhone = submitOrderButton?.dataset.phone || '59168504229';
        const url = `https://wa.me/${targetPhone.replace(/\D/g, '')}?text=${message}`;
        window.open(url, '_blank');

        $(customerModal).modal('hide');
    });

    // Vaciar Carrito
    clearCartBtn?.addEventListener('click', () => {
        const items = Object.values(getCart());
        if (!items.length) {
            mostrarToast('Tu carrito ya está vacío.', 'error', 'Atención');
            return;
        }
        if (!confirm('¿Deseas vaciar todos los productos del carrito?')) return;
        localStorage.removeItem('alicen_cart');
        window.dispatchEvent(new Event('cartUpdated'));
        renderCart();
        mostrarToast('Se ha vaciado el carrito.', 'success', 'Carrito vacío');
    });

    // Inicializar render
    renderCart();
});
