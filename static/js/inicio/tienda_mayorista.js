document.addEventListener('DOMContentLoaded', () => {
    const cartKey = 'alicen_cart_mayorista';
    const countNodes = document.querySelectorAll('#mayoristaCartCount, #cartCount, #mobileCartCount');
    const getCart = () => {
        try { return JSON.parse(localStorage.getItem(cartKey) || '{}'); } catch { return {}; }
    };
    const saveCart = (cart) => {
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCount(cart);
    };
    const updateCount = (cart) => {
        const count = Object.values(cart).reduce((total, item) => total + Number(item.cantidad || 0), 0);
        countNodes.forEach((node) => { node.textContent = count; });
    };
    const showToast = (message, title) => {
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast-success';
        toast.innerHTML = `<div class="toast-icon"><i class="fas fa-check"></i></div><div class="toast-text"><strong>${title}</strong><small>${message}</small></div>`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.add('toast-hide'); setTimeout(() => toast.remove(), 350); }, 2600);
    };

    document.querySelectorAll('.btn-add-mayorista').forEach((button) => {
        button.addEventListener('click', () => {
            const id = button.dataset.productId;
            const stock = Number(button.dataset.productStock || 0);
            const current = getCart()[id];
            const minimum = Number(button.closest('.product-card').querySelector('.mayorista-minimum')?.textContent.match(/\d+/)?.[0] || 1);
            if (!id || stock < minimum) {
                showToast('Este producto no tiene stock suficiente para el minimo mayorista.', 'Stock insuficiente');
                return;
            }
            const cart = getCart();
            const cantidad = Math.min(stock, Math.max(minimum, Number(current?.cantidad || 0) + minimum));
            cart[id] = { id, nombre: button.dataset.productName, precio: Number(button.dataset.productPrice || 0), cantidad, foto: button.dataset.productImage, stock, modalidad: 'mayorista', unidades_por_mayor: minimum };
            saveCart(cart);
            showToast('Producto agregado al carrito mayorista.', button.dataset.productName);
        });
    });

    const category = document.getElementById('filtroCategoriaMayorista');
    const subcategory = document.getElementById('filtroSubcategoriaMayorista');
    if (category && subcategory) {
        const filterSubcategories = () => {
            [...subcategory.options].forEach((option) => {
                option.hidden = Boolean(option.dataset.categoria) && option.dataset.categoria !== category.value;
            });
            if (subcategory.selectedOptions[0]?.hidden) subcategory.value = '';
        };
        category.addEventListener('change', filterSubcategories);
        filterSubcategories();
    }
    updateCount(getCart());
});
