document.addEventListener('DOMContentLoaded', () => {
    const detailForm = document.getElementById('detailAddToCartForm');
    const quantityInput = document.getElementById('detailQuantity');
    const productId = document.getElementById('detailProductId')?.value;
    const detailLocationId = document.getElementById('detailLocationId');
    const detailLocationName = document.getElementById('detailLocationName');
    const detailLocationPhone = document.getElementById('detailLocationPhone');
    const selectedStorePhoneDisplay = document.getElementById('detailSelectedStorePhone');
    const productName = document.getElementById('detailProductName')?.value;
    const productPrice = parseFloat(document.getElementById('detailProductPrice')?.value || '0');
    const productOferta = (document.getElementById('detailProductOferta')?.value === 'true');
    const productImage = document.getElementById('detailProductImage')?.value;
    const defaultStock = parseInt(quantityInput?.max || '0', 10);
    const cartCount = document.getElementById('cartCount');
    const selectedStoreRadios = document.querySelectorAll('.selected-store-radio');
    const whatsappButton = document.getElementById('detailWhatsappButton');

    const getSelectedStore = () => {
        const selected = document.querySelector('.selected-store-radio:checked');
        if (!selected) return null;
        return {
            id: selected.value,
            name: selected.dataset.storeName || '',
            phone: selected.dataset.storePhone || '',
            stock: parseInt(selected.dataset.storeStock || '0', 10) || 0,
        };
    };

    const updateSelectedStore = () => {
        const store = getSelectedStore();
        if (!store) return;
        if (detailLocationId) detailLocationId.value = store.id;
        if (detailLocationName) detailLocationName.value = store.name;
        if (detailLocationPhone) detailLocationPhone.value = store.phone;
        if (selectedStorePhoneDisplay) selectedStorePhoneDisplay.textContent = store.phone || 'Sin teléfono';
        if (quantityInput) quantityInput.max = store.stock || defaultStock;
    };

    selectedStoreRadios.forEach(radio => {
        radio.addEventListener('change', updateSelectedStore);
    });

    updateSelectedStore();

    const getCart = () => {
        try { return JSON.parse(localStorage.getItem('alicen_cart') || '{}'); } catch { return {}; }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        updateCartCount(cart);
    };

    const updateCartCount = (cart) => {
        const count = Object.values(cart).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        if (cartCount) cartCount.textContent = count;
    };

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

    const addToCart = (quantity) => {
        if (!productId || !productName || !productPrice || quantity < 1) return;
        const store = getSelectedStore();
        const cart = getCart();
        let selectedStock = defaultStock;
        let locationId = '';
        let locationName = '';
        let locationPhone = '';

        if (selectedStoreRadios.length > 0 && store) {
            selectedStock = store.stock;
            locationId = store.id;
            locationName = store.name;
            locationPhone = store.phone;
        }

        if (quantity > selectedStock) {
            mostrarToast(`La cantidad supera el stock disponible (${selectedStock}).`, 'error', 'Stock insuficiente');
            return;
        }

        const key = `${productId}_${locationId}`;
        const existing = cart[key] || {};
        const newQuantity = Math.min(selectedStock, (existing.cantidad || 0) + quantity);

        cart[key] = {
            id: productId,
            nombre: productName,
            precio: productPrice,
            cantidad: newQuantity,
            foto: productImage,
            ubicacion_id: locationId,
            ubicacion_nombre: locationName,
            ubicacion_telefono: locationPhone,
            stock: selectedStock,
            en_oferta: productOferta
        };
        saveCart(cart);
        mostrarToast(`${quantity} unidad${quantity === 1 ? '' : 'es'} agregada${quantity === 1 ? '' : 's'} al carrito.`, 'success', productName);
    };

    detailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantity = parseInt(quantityInput.value || '1', 10);
        if (quantity < 1) {
            mostrarToast('Ingresa una cantidad válida.', 'error', 'Datos incorrectos');
            return;
        }
        const store = getSelectedStore();
        const maxAllowed = store ? store.stock : defaultStock;
        if (quantity > maxAllowed) {
            mostrarToast(`La cantidad supera el stock disponible (${maxAllowed}).`, 'error', 'Stock insuficiente');
            return;
        }
        addToCart(quantity);
    });

    whatsappButton?.addEventListener('click', () => {
        const quantity = parseInt(quantityInput?.value || '1', 10);
        const store = getSelectedStore();
        const maxAllowed = store ? store.stock : defaultStock;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxAllowed) {
            mostrarToast(`La cantidad debe estar entre 1 y ${maxAllowed} unidades.`, 'error', 'Cantidad inválida');
            return;
        }
        const total = (quantity * productPrice).toFixed(2);
        const priceLabel = productOferta ? 'Precio unitario de oferta' : 'Precio unitario';
        const locationLine = store?.name ? `\nUbicación: ${store.name}` : '';
        const message = encodeURIComponent(`Hola, quiero pedir este producto.\n\nProducto: ${productName}\nCantidad: ${quantity}\n${priceLabel}: Bs ${productPrice.toFixed(2)}\nTotal: Bs ${total}${locationLine}`);
        window.open(`https://wa.me/68504229?text=${message}`, '_blank');
    });

    updateCartCount(getCart());

    // Acordeón de descripción
    const descriptionAccordion = document.querySelector('.description-accordion');
    const descriptionToggle = document.querySelector('.description-toggle');
    const descriptionContent = document.querySelector('.description-content');

    if (descriptionToggle && descriptionContent) {
        descriptionToggle.addEventListener('click', () => {
            const isOpen = descriptionAccordion.classList.contains('open');
            if (isOpen) {
                descriptionAccordion.classList.remove('open');
                descriptionContent.style.maxHeight = '0';
                descriptionToggle.setAttribute('aria-expanded', 'false');
            } else {
                descriptionAccordion.classList.add('open');
                descriptionContent.style.maxHeight = `${descriptionContent.scrollHeight}px`;
                descriptionToggle.setAttribute('aria-expanded', 'true');
            }
        });
    }

    // Galería de imágenes y video
    const galleryMainWrap = document.getElementById('galleryMainWrap');
    const galleryMainMedia = document.getElementById('galleryMainMedia');
    const galleryThumbs = document.getElementById('galleryThumbs');

    const showImage = (src, alt) => {
        galleryMainMedia.innerHTML = `<img src="${src}" alt="${alt || 'Producto'}" id="galleryMainImage" class="gallery-main-img">`;
        initZoom();
    };

    const showVideo = (src) => {
        const sep = src.includes('?') ? '&' : '?';
        galleryMainMedia.innerHTML = `<iframe src="${src}${sep}rel=0&autoplay=1&enablejsapi=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Video del producto"></iframe>`;
    };

    galleryThumbs?.querySelectorAll('.gallery-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
            galleryThumbs.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
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

    // Zoom en imagen (mouse y touch)
    function initZoom() {
        const wrap = galleryMainWrap;
        const img = document.getElementById('galleryMainImage');
        if (!wrap || !img) return;

        const ZOOM = 2.2;
        let zoomActive = false;

        const applyZoom = (clientX, clientY) => {
            const rect = wrap.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
            img.style.transformOrigin = `${x}% ${y}%`;
            img.style.transform = `scale(${ZOOM})`;
        };

        const resetZoom = () => {
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center center';
            zoomActive = false;
        };

        wrap.addEventListener('mouseenter', () => { zoomActive = true; });
        wrap.addEventListener('mouseleave', resetZoom);
        wrap.addEventListener('mousemove', (e) => {
            if (zoomActive) applyZoom(e.clientX, e.clientY);
        });

        wrap.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                zoomActive = true;
                applyZoom(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        wrap.addEventListener('touchmove', (e) => {
            if (zoomActive && e.touches.length === 1) {
                applyZoom(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        wrap.addEventListener('touchend', resetZoom);
    }

    initZoom();
});
