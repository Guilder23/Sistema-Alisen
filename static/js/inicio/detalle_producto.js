document.addEventListener('DOMContentLoaded', () => {
    const detailForm = document.getElementById('detailAddToCartForm');
    const quantityInput = document.getElementById('detailQuantity');
    const productId = document.getElementById('detailProductId')?.value;
    const productName = document.getElementById('detailProductName')?.value;
    const productPrice = parseFloat(document.getElementById('detailProductPrice')?.value || '0');
    const productImage = document.getElementById('detailProductImage')?.value;
    const stock = parseInt(quantityInput?.max || '0', 10);
    const cartCount = document.getElementById('cartCount');

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
        const cart = getCart();
        const key = String(productId);
        const existing = cart[key] || {};
        const newQuantity = Math.min(stock, (existing.cantidad || 0) + quantity);
        cart[key] = { id: productId, nombre: productName, precio: productPrice, cantidad: newQuantity, foto: productImage };
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
        if (quantity > stock) {
            mostrarToast(`La cantidad supera el stock disponible (${stock}).`, 'error', 'Stock insuficiente');
            return;
        }
        addToCart(quantity);
    });

    updateCartCount(getCart());

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
        galleryMainMedia.innerHTML = `<iframe src="${src}${sep}rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Video del producto"></iframe>`;
        document.getElementById('galleryVideoSection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
