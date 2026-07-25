document.addEventListener('DOMContentLoaded', function() {
    const cartCount = document.getElementById('cartCount');
    const addButtons = Array.from(document.querySelectorAll('.btn-add'));

    const getCart = () => {
        try {
            return JSON.parse(localStorage.getItem('alicen_cart') || '{}');
        } catch {
            return {};
        }
    };

    const saveCart = (cart) => {
        localStorage.setItem('alicen_cart', JSON.stringify(cart));
        updateCartCount(cart);
    };

    const updateCartCount = (cart) => {
        const count = Object.values(cart).reduce((sum, item) => sum + (item.cantidad || 0), 0);
        if (cartCount) {
            cartCount.textContent = count;
        }
    };

    const addItem = (button) => {
        const productId = button.dataset.productId;
        const nombre = button.dataset.productName;
        const precio = parseFloat(button.dataset.productPrice || '0');
        const foto = button.dataset.productImage;
        const stock = parseInt(button.dataset.productStock || '0', 10);

        if (!productId || !nombre || !precio || stock <= 0) {
            alert('No se puede agregar este producto al carrito.');
            return;
        }

        const cart = getCart();
        const key = String(productId);
        const current = cart[key] || {};
        const cantidad = Math.min(stock, (current.cantidad || 0) + 1);

        cart[key] = {
            id: productId,
            nombre,
            precio,
            cantidad,
            foto,
        };

        saveCart(cart);
        alert('Producto agregado al carrito.');
    };

    addButtons.forEach(button => button.addEventListener('click', () => addItem(button)));
    updateCartCount(getCart());
});
