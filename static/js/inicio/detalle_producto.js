/* ============================================================================
   DETALLE_PRODUCTO.JS - Lógica de detalle de producto minorista
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const detailForm = document.getElementById('detailAddToCartForm');
    const quantityInput = document.getElementById('detailQuantity');
    const btnQtyMinus = document.getElementById('btnQtyMinus');
    const btnQtyPlus = document.getElementById('btnQtyPlus');
    const productId = document.getElementById('detailProductId')?.value;
    const productName = document.getElementById('detailProductName')?.value;
    const productPrice = parseFloat(document.getElementById('detailProductPrice')?.value || '0');
    const productOferta = (document.getElementById('detailProductOferta')?.value === 'true');
    const productImage = document.getElementById('detailProductImage')?.value;
    const defaultStock = parseInt(document.getElementById('detailProductStock')?.value || '999', 10);
    const whatsappButton = document.getElementById('detailWhatsappButton');

    // Stepper de Cantidad
    if (btnQtyMinus && quantityInput) {
        btnQtyMinus.addEventListener('click', () => {
            let val = parseInt(quantityInput.value, 10) || 1;
            if (val > 1) {
                quantityInput.value = val - 1;
            }
        });
    }

    if (btnQtyPlus && quantityInput) {
        btnQtyPlus.addEventListener('click', () => {
            let val = parseInt(quantityInput.value, 10) || 1;
            if (val < defaultStock) {
                quantityInput.value = val + 1;
            }
        });
    }

    const getCart = () => {
        try { return JSON.parse(localStorage.getItem('alicen_cart') || '{}'); } catch { return {}; }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const mostrarToast = (mensaje, tipo = 'success', titulo = '') => {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        const iconClass = tipo === 'success' ? 'fa-check' : 'fa-exclamation-triangle';
        const titleText = titulo || (tipo === 'success' ? '¡Agregado!' : 'Atención');
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
        const newQuantity = Math.min(defaultStock, (existing.cantidad || 0) + quantity);

        cart[key] = {
            id: productId,
            nombre: productName,
            precio: productPrice,
            cantidad: newQuantity,
            foto: productImage,
            stock: defaultStock,
            en_oferta: productOferta
        };

        saveCart(cart);
        mostrarToast(`Se agregó "${productName}" (${quantity} unid.) al carrito.`, 'success', '¡Añadido al carrito!');
    };

    detailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantity = parseInt(quantityInput?.value || '1', 10);
        if (isNaN(quantity) || quantity < 1) {
            mostrarToast('Ingresa una cantidad válida.', 'error', 'Error');
            return;
        }
        if (quantity > defaultStock && defaultStock > 0) {
            mostrarToast(`La cantidad supera el stock disponible (${defaultStock}).`, 'error', 'Stock insuficiente');
            return;
        }
        addToCart(quantity);
    });

    whatsappButton?.addEventListener('click', () => {
        const quantity = parseInt(quantityInput?.value || '1', 10);
        if (isNaN(quantity) || quantity < 1) {
            mostrarToast('Ingresa una cantidad válida.', 'error', 'Error');
            return;
        }
        const total = (quantity * productPrice).toFixed(2);
        const message = encodeURIComponent(
            `Hola 👋, deseo pedir el siguiente producto:\n\n` +
            `📦 *Producto:* ${productName}\n` +
            `🔢 *Cantidad:* ${quantity} unidad(es)\n` +
            `💰 *Precio unitario:* Bs ${productPrice.toFixed(2)}\n` +
            `💵 *Total estimado:* Bs ${total}\n\n` +
            `¿Podrían confirmarme la disponibilidad y formas de envío?`
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

    // Galería Multimedia (Imágenes y Video)
    const galleryMainMedia = document.getElementById('galleryMainMedia');
    const galleryThumbs = document.getElementById('galleryThumbs');

    const showImage = (src, alt) => {
        if (!galleryMainMedia) return;
        galleryMainMedia.innerHTML = `<img src="${src}" alt="${alt || 'Producto'}" id="galleryMainImage" class="gallery-main-img">`;
    };

    const showVideo = (src) => {
        if (!galleryMainMedia) return;
        const sep = src.includes('?') ? '&' : '?';
        galleryMainMedia.innerHTML = `<iframe src="${src}${sep}rel=0&autoplay=1&enablejsapi=1" style="width:100%; aspect-ratio:16/9; border:0; border-radius:12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Video del producto"></iframe>`;
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
