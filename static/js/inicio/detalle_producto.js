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

    const addToCart = (quantity) => {
        if (!productId || !productName || !productPrice || quantity < 1) return;
        const cart = getCart();
        const key = String(productId);
        const existing = cart[key] || {};
        const newQuantity = Math.min(stock, (existing.cantidad || 0) + quantity);
        cart[key] = { id: productId, nombre: productName, precio: productPrice, cantidad: newQuantity, foto: productImage };
        saveCart(cart);
        alert('Producto agregado al carrito.');
    };

    detailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantity = parseInt(quantityInput.value || '1', 10);
        if (quantity < 1) { alert('Ingresa una cantidad válida.'); return; }
        if (quantity > stock) { alert('La cantidad supera el stock disponible.'); return; }
        addToCart(quantity);
    });

    updateCartCount(getCart());
});
