document.addEventListener('DOMContentLoaded', () => {
    const cartContent = document.getElementById('cartContent');
    const cartTotal = document.getElementById('cartTotal');
    const cartItemCount = document.getElementById('cartItemCount');
    const showFormButton = document.getElementById('showFormButton');
    const checkoutForm = document.getElementById('checkoutForm');
    const submitOrderButton = document.getElementById('submitOrderButton');
    const deliveryModal = document.getElementById('deliveryModal');
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    const continueDeliveryButton = document.getElementById('continueDeliveryButton');
    let selectedDelivery = '';
    const deliveryNote = document.getElementById('deliveryNote');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const customerModal = document.getElementById('customerModal');

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
        if (showFormButton) showFormButton.disabled = true;
    };

    const renderCart = () => {
        const cart = getCart();
        let needsSave = false;
        const items = Object.values(cart).map((item) => {
            const maxStock = Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity;
            if (item.cantidad > maxStock) {
                item.cantidad = maxStock;
                cart[`${item.id}_${item.ubicacion_id || ''}`] = item;
                needsSave = true;
            }
            return item;
        });
        if (needsSave) {
            saveCart(cart);
            return;
        }

        const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0);
        if (!items.length) { renderEmpty(); return; }

        const htmlItems = items.map(item => `
            <article class="cart-item">
                <div class="cart-item-image"><img src="${item.foto || '/static/img/logoAlmacen.png'}" alt="${item.nombre}"></div>
                <div class="cart-item-main">
                    <div class="cart-item-header">
                        <strong>${item.nombre}</strong>
                        <div class="cart-item-price">Bs ${formatCurrency(item.precio)} por unidad</div>
                    </div>
                    <div class="cart-item-store text-muted small mb-2">
                        Tienda: ${item.ubicacion_nombre || 'No definida'}
                    </div>
                    <div class="cart-item-controls">
                        <button class="btn btn-sm btn-light quantity-control" data-action="decrease" data-id="${item.id}_${item.ubicacion_id || ''}" aria-label="Disminuir cantidad">-</button>
                        <input type="number" class="form-control quantity-input" min="1" value="${item.cantidad}" data-id="${item.id}_${item.ubicacion_id || ''}">
                        <button class="btn btn-sm btn-light quantity-control" data-action="increase" data-id="${item.id}_${item.ubicacion_id || ''}" aria-label="Aumentar cantidad">+</button>
                    </div>
                    <div class="cart-item-footer">
                        <div class="cart-item-total">Total: Bs ${formatCurrency(item.cantidad * item.precio)}</div>
                        <button class="btn btn-sm btn-outline-danger remove-item" data-id="${item.id}_${item.ubicacion_id || ''}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </article>
        `).join('');

        cartContent.innerHTML = htmlItems;
        cartTotal.textContent = formatCurrency(calculateTotal(items));
        if (cartItemCount) cartItemCount.textContent = String(totalItems);
        if (showFormButton) showFormButton.disabled = false;

        const storeNames = [...new Set(items.map(item => item.ubicacion_nombre).filter(Boolean))];
        const cartStoreNameElem = document.getElementById('cartStoreName');
        const cartStorePhoneElem = document.getElementById('cartStorePhone');
        const displayStoreName = storeNames.length === 1 ? storeNames[0] : (storeNames.length > 1 ? 'Varias tiendas' : 'Tienda no definida');
        if (cartStoreNameElem) cartStoreNameElem.textContent = displayStoreName;
        if (cartStorePhoneElem) cartStorePhoneElem.textContent = '68504229';
        if (submitOrderButton) submitOrderButton.dataset.phone = '68504229';

        cartContent.querySelectorAll('.quantity-control').forEach(button => {
            button.addEventListener('click', () => {
                const cart = getCart();
                const id = button.dataset.id;
                const action = button.dataset.action;
                if (!cart[id]) return;
                const current = cart[id].cantidad;
                const maxStock = Number.isFinite(Number(cart[id].stock)) ? cart[id].stock : Infinity;
                const next = action === 'increase' ? current + 1 : current - 1;
                if (next < 1) return;
                if (next > maxStock) {
                    mostrarToast(`No puedes pedir más de ${maxStock} unidades de esta tienda.`, 'error', 'Stock insuficiente');
                    return;
                }
                cart[id].cantidad = next;
                saveCart(cart);
            });
        });

        cartContent.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const cart = getCart();
                const id = input.dataset.id;
                if (!cart[id]) return;
                const maxStock = Number.isFinite(Number(cart[id].stock)) ? cart[id].stock : Infinity;
                let nextValue = parseInt(input.value, 10);
                if (Number.isNaN(nextValue) || nextValue < 1) {
                    nextValue = 1;
                }
                if (nextValue > maxStock) {
                    nextValue = maxStock;
                    mostrarToast(`No puedes pedir más de ${maxStock} unidades de esta tienda.`, 'error', 'Stock insuficiente');
                }
                input.value = nextValue;
                cart[id].cantidad = nextValue;
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

    deliveryOptions.forEach(option => option.addEventListener('click', () => {
        deliveryOptions.forEach(item => item.classList.remove('active'));
        option.classList.add('active');
        selectedDelivery = option.dataset.delivery || '';
        if (continueDeliveryButton) continueDeliveryButton.disabled = !selectedDelivery;
    }));

    continueDeliveryButton?.addEventListener('click', () => {
        if (!selectedDelivery) return;
        $(deliveryModal).modal('hide');
        configureCustomerFields();
        $('#customerModal').modal('show');
    });

    const configureCustomerFields = () => {
        const isDepartment = selectedDelivery === 'department';
        const isDelivery = selectedDelivery === 'delivery';
        const phoneGroup = document.getElementById('customerPhoneGroup');
        const addressGroup = document.getElementById('customerAddressGroup');
        const departmentGroup = document.getElementById('departmentGroup');
        const provinceGroup = document.getElementById('provinceGroup');
        const phoneInput = document.getElementById('customerPhone');
        const addressInput = document.getElementById('customerAddress');
        const departmentInput = document.getElementById('customerDepartment');
        const provinceInput = document.getElementById('customerProvince');
        phoneGroup.style.display = isDepartment ? 'block' : 'none';
        addressGroup.style.display = isDelivery || isDepartment ? 'block' : 'none';
        departmentGroup.style.display = isDepartment ? 'block' : 'none';
        provinceGroup.style.display = isDepartment ? 'block' : 'none';
        phoneInput.required = isDepartment;
        addressInput.required = isDelivery || isDepartment;
        departmentInput.required = isDepartment;
        provinceInput.required = isDepartment;
        document.getElementById('deliveryNote').style.display = isDelivery || isDepartment ? 'block' : 'none';
    };

    showFormButton?.addEventListener('click', (e) => {
        const items = getCartItems();
        if (!items.length) {
            e.preventDefault();
            mostrarToast('Agrega productos al carrito antes de enviar el pedido.', 'error', 'Carrito vacío');
            return false;
        }
    });

    // Resetear formulario cuando se cierra el modal
    if (customerModal) {
        customerModal.addEventListener('hidden.bs.modal', () => {
            checkoutForm.reset();
            selectedDelivery = '';
            deliveryOptions.forEach(item => item.classList.remove('active'));
            if (continueDeliveryButton) continueDeliveryButton.disabled = true;
        });
    }

    checkoutForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const items = getCartItems();
        if (!items.length) {
            mostrarToast('Agrega productos al carrito antes de enviar el pedido.', 'error', 'Carrito vacío');
            return;
        }

        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const customerAddress = document.getElementById('customerAddress').value.trim();
        const customerDepartment = document.getElementById('customerDepartment').value.trim();
        const customerProvince = document.getElementById('customerProvince').value.trim();
        const deliveryOptionValue = selectedDelivery;

        if (!customerName || !deliveryOptionValue) {
            mostrarToast('Por favor, completa todos los campos requeridos.', 'error', 'Datos incompletos');
            return;
        }
        if (deliveryOptionValue === 'delivery' && !customerAddress) {
            mostrarToast('Por favor, ingresa la dirección para delivery.', 'error', 'Dirección requerida');
            return;
        }
        if (deliveryOptionValue === 'department' && (!customerPhone || !customerDepartment || !customerProvince || !customerAddress)) {
            mostrarToast('Completa teléfono de referencia, departamento, provincia y dirección.', 'error', 'Datos incompletos');
            return;
        }

        const lines = items.map(item => {
            const label = item.en_oferta ? `${item.nombre} (OFERTA)` : item.nombre;
            return `${label} x ${item.cantidad} = Bs ${formatCurrency(item.cantidad * item.precio)}`;
        });
        const total = formatCurrency(calculateTotal(items));
        const deliveryText = deliveryOptionValue === 'delivery' ? 'Delivery' : (deliveryOptionValue === 'department' ? 'Envío a departamento' : 'Recoger en tienda');
        const addressLine = customerAddress ? `Dirección: ${customerAddress}\n` : '';
        const departmentLine = deliveryOptionValue === 'department' ? `Departamento: ${customerDepartment}\nProvincia: ${customerProvince}\nTeléfono de referencia: ${customerPhone}\n` : '';
        
        const message = encodeURIComponent(
            `Hola, quiero hacer un pedido:\n\n` +
            `📋 DATOS DEL CLIENTE:\n` +
            `Nombre: ${customerName}\n` +
            addressLine +
            departmentLine +
            `Opción de entrega: ${deliveryText}\n\n` +
            `📦 PEDIDO:\n${lines.join('\n')}\n\n` +
            `💰 Total productos: Bs ${total}\n\n` +
            `Por favor, confirmen disponibilidad y el costo de envío.`
        );
        
        const phone = submitOrderButton?.dataset.phone || '';
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        // Cerrar el modal después de enviar
        if (customerModal) {
            $(customerModal).modal('hide');
        }
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
