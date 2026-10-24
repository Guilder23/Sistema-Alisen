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
    const parsedStock = parseInt(document.getElementById('detailProductStock')?.value, 10);
    const defaultStock = (Number.isFinite(parsedStock) && parsedStock > 0) ? parsedStock : 999;
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
    const galleryCounterBadge = document.getElementById('galleryCounterBadge');
    const totalGalleryItems = galleryThumbs ? galleryThumbs.querySelectorAll('.gallery-thumb-item').length : 1;

    const updateGalleryCounter = (index) => {
        if (!galleryCounterBadge || !totalGalleryItems) return;
        galleryCounterBadge.textContent = `${index}/${totalGalleryItems}`;
    };

    const showImage = (src, alt, index = 1) => {
        if (!galleryMainMedia) return;
        galleryMainMedia.innerHTML = `<img src="${src}" alt="${alt || 'Producto'}" id="galleryMainImage" class="gallery-main-img">`;
        updateGalleryCounter(index);
    };

    const showVideo = (src, index = totalGalleryItems) => {
        if (!galleryMainMedia) return;
        const sep = src.includes('?') ? '&' : '?';
        galleryMainMedia.innerHTML = `<iframe src="${src}${sep}rel=0&autoplay=1&enablejsapi=1" style="width:100%; aspect-ratio:16/9; border:0; border-radius:12px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Video del producto"></iframe>`;
        updateGalleryCounter(index);
    };

    galleryThumbs?.querySelectorAll('.gallery-thumb-item').forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            galleryThumbs.querySelectorAll('.gallery-thumb-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            const type = thumb.dataset.type;
            const src = thumb.dataset.src;
            if (type === 'video') {
                showVideo(src, index + 1);
            } else {
                showImage(src, thumb.querySelector('img')?.alt, index + 1);
            }
        });
    });

    if (galleryMainMedia && galleryThumbs) {
        const activeThumb = galleryThumbs.querySelector('.gallery-thumb-item.active') || galleryThumbs.querySelector('.gallery-thumb-item');
        if (activeThumb) {
            const activeIndex = [...galleryThumbs.querySelectorAll('.gallery-thumb-item')].indexOf(activeThumb) + 1;
            updateGalleryCounter(activeIndex);
        }
    }

    // Zoom de la imagen principal: hover en PC, toque y arrastre en celular
    (function initProductZoom() {
    const wrap = document.getElementById('galleryMainWrap');
    if (!wrap) return;

    const getImage = () => wrap.querySelector('.gallery-main-img');
    const setOrigin = (img, clientX, clientY) => {
        const rect = wrap.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
        img.style.transformOrigin = `${x}% ${y}%`;
    };
    const resetZoom = () => {
        wrap.classList.remove('is-zoomed', 'is-panning');
        const img = getImage();
        if (img) img.style.transformOrigin = '50% 50%';
    };

    // Mouse (PC)
    wrap.addEventListener('mouseenter', (e) => {
        if (e.pointerType === 'touch') return;
        const img = getImage();
        if (!img) return;
        setOrigin(img, e.clientX, e.clientY);
        wrap.classList.add('is-zoomed');
    });
    wrap.addEventListener('mousemove', (e) => {
        const img = getImage();
        if (img && wrap.classList.contains('is-zoomed')) setOrigin(img, e.clientX, e.clientY);
    });
    wrap.addEventListener('mouseleave', resetZoom);

    // Táctil (celular): tocar alterna el zoom y arrastrar mueve la imagen ampliada
    let moved = false;
    wrap.addEventListener('touchstart', (e) => {
        moved = false;
        if (wrap.classList.contains('is-zoomed') && e.touches.length === 1) {
            wrap.classList.add('is-panning');
        }
    }, { passive: true });
    wrap.addEventListener('touchmove', (e) => {
        const img = getImage();
        if (!img || !wrap.classList.contains('is-zoomed') || e.touches.length !== 1) return;
        moved = true;
        setOrigin(img, e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }, { passive: false });
    wrap.addEventListener('touchend', (e) => {
        wrap.classList.remove('is-panning');
        const img = getImage();
        if (moved || !img || !e.target.closest('.gallery-main-img')) return;
        e.preventDefault();
        if (wrap.classList.contains('is-zoomed')) {
            resetZoom();
        } else {
            const touch = e.changedTouches[0];
            setOrigin(img, touch.clientX, touch.clientY);
            wrap.classList.add('is-zoomed');
        }
    });

    // Al cambiar de miniatura se reinicia el zoom
    const thumbs = document.getElementById('galleryThumbs');
    thumbs?.addEventListener('click', resetZoom);
    })();
});
