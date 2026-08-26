/* ============================================================================
   DETALLE_PRODUCTO_MAYORISTA.JS - Lógica de detalle de producto mayorista
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const key = 'alicen_cart_mayorista';
    const detailForm = document.getElementById('detailMayoristaForm');
    const quantityInput = document.getElementById('detailMayoristaQuantity');
    const btnMayoristaQtyMinus = document.getElementById('btnMayoristaQtyMinus');
    const btnMayoristaQtyPlus = document.getElementById('btnMayoristaQtyPlus');
    const productId = document.getElementById('detailMayoristaProductId')?.value;
    const productName = document.getElementById('detailMayoristaProductName')?.value;
    const productPrice = parseFloat(document.getElementById('detailMayoristaProductPrice')?.value || '0');
    const productImage = document.getElementById('detailMayoristaProductImage')?.value;
    const minimum = parseInt(document.getElementById('detailMayoristaMinimum')?.value || '1', 10);
    const parsedStock = parseInt(document.getElementById('detailMayoristaStock')?.value, 10);
    const defaultStock = (Number.isFinite(parsedStock) && parsedStock > 0) ? parsedStock : 9999;
    const whatsappButton = document.getElementById('detailMayoristaWhatsappButton');

    // Stepper de Cantidad Mayorista por lote
    if (btnMayoristaQtyMinus && quantityInput) {
        btnMayoristaQtyMinus.addEventListener('click', () => {
            let val = parseInt(quantityInput.value, 10) || minimum;
            if (val - minimum >= minimum) {
                quantityInput.value = val - minimum;
            } else {
                quantityInput.value = minimum;
            }
        });
    }

    if (btnMayoristaQtyPlus && quantityInput) {
        btnMayoristaQtyPlus.addEventListener('click', () => {
            let val = parseInt(quantityInput.value, 10) || minimum;
            if (val + minimum <= defaultStock) {
                quantityInput.value = val + minimum;
            }
        });
    }

    const getCart = () => {
        try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
    };

    const saveCart = (cart) => {
        localStorage.setItem(key, JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const mostrarToast = (mensaje, tipo = 'success', titulo = '') => {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        const iconClass = tipo === 'success' ? 'fa-check' : 'fa-exclamation-triangle';
        const titleText = titulo || (tipo === 'success' ? '¡Mayorista Agregado!' : 'Atención');
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
        if (!productId || !productName || !productPrice || quantity < minimum) return;
        const cart = getCart();
        const itemKey = String(productId);
        const existing = cart[itemKey] || {};
        const newQuantity = Math.min(defaultStock, (existing.cantidad || 0) + quantity);

        cart[itemKey] = {
            id: productId,
            nombre: productName,
            precio: productPrice,
            cantidad: newQuantity,
            foto: productImage,
            unidades_por_mayor: minimum,
            stock: defaultStock
        };

        saveCart(cart);
        mostrarToast(`Se agregaron ${quantity} unidades de "${productName}" al carrito mayorista.`, 'success', '¡Mayorista!');
    };

    detailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantity = parseInt(quantityInput?.value || String(minimum), 10);
        if (isNaN(quantity) || quantity < minimum) {
            mostrarToast(`La cantidad mínima para este producto es de ${minimum} unidades.`, 'error', 'Mínimo requerido');
            return;
        }
        addToCart(quantity);
    });

    whatsappButton?.addEventListener('click', () => {
        const quantity = parseInt(quantityInput?.value || String(minimum), 10);
        if (isNaN(quantity) || quantity < minimum) {
            mostrarToast(`La cantidad mínima para este producto es de ${minimum} unidades.`, 'error', 'Mínimo requerido');
            return;
        }
        const total = (quantity * productPrice).toFixed(2);
        const message = encodeURIComponent(
            `Hola 👋, deseo realizar un pedido MAYORISTA del siguiente producto:\n\n` +
            `📦 *Producto:* ${productName}\n` +
            `🔢 *Cantidad:* ${quantity} unidades (Mínimo: ${minimum})\n` +
            `💰 *Precio mayorista:* Bs ${productPrice.toFixed(2)} c/u\n` +
            `💵 *Total mayorista:* Bs ${total}\n\n` +
            `Por favor, ¿me confirman disponibilidad de stock y coordinación de despacho?`
        );
        window.open(`https://wa.me/59168504229?text=${message}`, '_blank');
    });

    // Acordeón de Descripción
    const descToggle = document.querySelector('.description-toggle-btn');
    const descBody = document.querySelector('.description-body-content');
    if (descToggle && descBody) {
        descToggle.addEventListener('click', () => {
            const isOpen = descBody.classList.contains('open');
            descToggle.classList.toggle('active', !isOpen);
            descBody.classList.toggle('open', !isOpen);
            descToggle.setAttribute('aria-expanded', !isOpen);
        });
    }

    // Galería
    const galleryMainMedia = document.getElementById('galleryMainMedia');
    const galleryThumbs = document.getElementById('galleryThumbs');

    const showImage = (src, alt) => {
        if (!galleryMainMedia) return;
        galleryMainMedia.innerHTML = `<img src="${src}" alt="${alt || 'Producto Mayorista'}" id="galleryMainImage" class="gallery-main-img">`;
    };

    const showVideo = (src) => {
        if (!galleryMainMedia) return;
        const sep = src.includes('?') ? '&' : '?';
        galleryMainMedia.innerHTML = `<iframe src="${src}${sep}rel=0&autoplay=1&enablejsapi=1" style="width:100%; aspect-ratio:16/9; border:0; border-radius:12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Video mayorista"></iframe>`;
    };

    galleryThumbs?.querySelectorAll('.gallery-thumb-item').forEach((thumb) => {
        thumb.addEventListener('click', () => {
            galleryThumbs.querySelectorAll('.gallery-thumb-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            const type = thumb.dataset.type;
            const src = thumb.dataset.src;
            if (type === 'video') {
                showVideo(src);
            } else {
                showImage(src, thumb.querySelector('img')?.alt);
            }
        });
    });
});
