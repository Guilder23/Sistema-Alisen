/* ============================================================================
   INDEX.JS - Control de carrito y acciones de inicio
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const addButtons = Array.from(document.querySelectorAll('.btn-add'));
    const whatsappButtons = Array.from(document.querySelectorAll('.btn-whatsapp-buy'));

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

    const addItem = (button) => {
        const productId = button.dataset.productId;
        const nombre = button.dataset.productName;
        const precio = parseFloat(button.dataset.productPrice || '0');
        const enOferta = (button.dataset.productOferta === 'true');
        const foto = button.dataset.productImage;
        const stock = parseInt(button.dataset.productStock || '999', 10);

        if (!productId || !nombre || isNaN(precio) || precio <= 0) {
            mostrarToast('No se puede agregar este producto al carrito.', 'error', 'Error');
            return;
        }

        const cart = getCart();
        const key = String(productId);
        const current = cart[key] || {};
        const currentQty = current.cantidad || 0;

        if (currentQty >= stock && stock > 0) {
            mostrarToast(`Stock máximo alcanzado (${stock} unidades).`, 'error', nombre);
            return;
        }

        const cantidad = currentQty + 1;

        cart[key] = {
            id: productId,
            nombre,
            precio,
            cantidad,
            foto,
            en_oferta: enOferta,
            stock: stock
        };

        saveCart(cart);

        // Feedback de botón
        const originalHtml = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check text-success"></i>';
        button.classList.add('btn-added');
        setTimeout(() => {
            button.innerHTML = originalHtml;
            button.classList.remove('btn-added');
        }, 800);

        mostrarToast(`Se agregó "${nombre}" al carrito.`, 'success', '¡Producto añadido!');
    };

    addButtons.forEach(button => button.addEventListener('click', () => addItem(button)));

    const comprarPorWhatsApp = (button) => {
        const phone = button.dataset.whatsappNumber || '59168504229';
        const name = button.dataset.productName || 'Producto';
        const price = button.dataset.productPrice || '0';

        const message = `Hola 👋, estoy interesado/a en comprar:\n\n📦 *Producto:* ${name}\n💰 *Precio:* Bs ${price}\n\n¿Tienen disponibilidad y cómo coordinamos el envío?`;
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    whatsappButtons.forEach(button => button.addEventListener('click', () => comprarPorWhatsApp(button)));
});
