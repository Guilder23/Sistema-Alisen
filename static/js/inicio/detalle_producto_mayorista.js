document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('detailMayoristaForm');
    const quantityInput = document.getElementById('detailMayoristaQuantity');
    const productId = document.getElementById('detailMayoristaProductId')?.value;
    const productName = document.getElementById('detailMayoristaProductName')?.value || '';
    const productPrice = Number(document.getElementById('detailMayoristaProductPrice')?.value || 0);
    const productImage = document.getElementById('detailMayoristaProductImage')?.value || '';
    const minimum = Number(document.getElementById('detailMayoristaMinimum')?.value || 1);
    const stock = Number(document.getElementById('detailMayoristaStock')?.value || 0);
    const whatsappButton = document.getElementById('detailMayoristaWhatsappButton');

    const getCart = () => {
        try { return JSON.parse(localStorage.getItem('alicen_cart_mayorista') || '{}'); } catch { return {}; }
    };
    const showToast = (message, title, error = false) => {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${error ? 'error' : 'success'}`;
        toast.innerHTML = `<div class="toast-icon"><i class="fas fa-${error ? 'exclamation-triangle' : 'check'}"></i></div><div class="toast-text"><strong>${title}</strong><small>${message}</small></div>`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.add('toast-hide'); setTimeout(() => toast.remove(), 350); }, 2800);
    };

    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        let quantity = parseInt(quantityInput?.value || minimum, 10);
        if (!Number.isInteger(quantity) || quantity < minimum || quantity > stock) {
            showToast(`La cantidad debe estar entre ${minimum} y ${stock} unidades.`, 'Cantidad inválida', true);
            return;
        }
        const cart = getCart();
        const current = cart[productId];
        const nextQuantity = (current?.cantidad || 0) + quantity;
        if (nextQuantity > stock) {
            showToast(`No puedes superar el stock disponible de ${stock} unidades.`, 'Stock insuficiente', true);
            return;
        }
        cart[productId] = { id: productId, nombre: productName, precio: productPrice, cantidad: nextQuantity, foto: productImage, stock, modalidad: 'mayorista', unidades_por_mayor: minimum };
        localStorage.setItem('alicen_cart_mayorista', JSON.stringify(cart));
        showToast(`${quantity} unidades agregadas al carrito mayorista.`, productName);
    });

    whatsappButton?.addEventListener('click', () => {
        const quantity = parseInt(quantityInput?.value || minimum, 10);
        if (!Number.isInteger(quantity) || quantity < minimum || quantity > stock) {
            showToast(`La cantidad debe estar entre ${minimum} y ${stock} unidades.`, 'Cantidad inválida', true);
            return;
        }
        const total = (quantity * productPrice).toFixed(2);
        const message = encodeURIComponent(`Hola, quiero pedir este producto MAYORISTA.\n\nProducto: ${productName}\nCantidad: ${quantity}\nPrecio unitario mayorista: Bs ${productPrice.toFixed(2)}\nTotal: Bs ${total}`);
        window.open(`https://wa.me/68504229?text=${message}`, '_blank');
    });

    const descriptionToggle = document.querySelector('.description-toggle');
    const descriptionAccordion = document.querySelector('.description-accordion');
    const descriptionContent = document.querySelector('.description-content');
    descriptionToggle?.addEventListener('click', () => {
        const open = descriptionAccordion.classList.toggle('open');
        descriptionContent.style.maxHeight = open ? `${descriptionContent.scrollHeight}px` : '0';
        descriptionToggle.setAttribute('aria-expanded', String(open));
    });

    const media = document.getElementById('galleryMainMedia');
    document.querySelectorAll('.gallery-thumb').forEach((thumb) => thumb.addEventListener('click', () => {
        document.querySelectorAll('.gallery-thumb').forEach((item) => item.classList.remove('active'));
        thumb.classList.add('active');
        if (thumb.dataset.type === 'video') {
            const separator = thumb.dataset.src.includes('?') ? '&' : '?';
            media.innerHTML = `<iframe src="${thumb.dataset.src}${separator}rel=0&autoplay=1" allow="autoplay; encrypted-media" allowfullscreen title="Video del producto"></iframe>`;
        } else {
            media.innerHTML = `<img src="${thumb.dataset.src}" alt="${productName}" id="galleryMainImage" class="gallery-main-img">`;
        }
    }));
});
