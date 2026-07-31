document.addEventListener('DOMContentLoaded', () => {
    const cartCountEl = document.getElementById('cartCount');
    const mobileCartCountEl = document.getElementById('mobileCartCount');
    const searchInput = document.getElementById('navbarSearchInput');
    const searchForm = document.getElementById('navbarSearchForm');
    const productCards = Array.from(document.querySelectorAll('.product-card'));

    // Mobile sidebar functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarOverlay = document.getElementById('mobileSidebarOverlay');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');

    const toggleMobileSidebar = () => {
        mobileSidebar.classList.toggle('active');
        mobileSidebarOverlay.classList.toggle('active');
        document.body.style.overflow = mobileSidebar.classList.contains('active') ? 'hidden' : '';
    };

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
    }

    if (mobileSidebarClose) {
        mobileSidebarClose.addEventListener('click', toggleMobileSidebar);
    }

    if (mobileSidebarOverlay) {
        mobileSidebarOverlay.addEventListener('click', toggleMobileSidebar);
    }

    // Close sidebar when clicking on nav links
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileSidebar.classList.contains('active')) {
                toggleMobileSidebar();
            }
        });
    });

    const getCart = () => {
        try { return JSON.parse(localStorage.getItem('alicen_cart') || '{}'); } catch { return {}; }
    };

    const updateCartCount = () => {
        const cart = getCart();
        const count = Object.values(cart).reduce((s, it) => s + (it.cantidad || 0), 0);
        if (cartCountEl) cartCountEl.textContent = count;
        if (mobileCartCountEl) mobileCartCountEl.textContent = count;
    };

    const filterProducts = (query) => {
        if (!productCards.length) return;
        const normalized = query.trim().toLowerCase();
        productCards.forEach((card) => {
            const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.product-description')?.textContent.toLowerCase() || '';
            const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
            const match = !normalized || title.includes(normalized) || description.includes(normalized) || category.includes(normalized);
            card.style.display = match ? '' : 'none';
        });
    };

    if (searchInput) {
        searchInput.addEventListener('input', () => filterProducts(searchInput.value));
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            if (productCards.length) {
                event.preventDefault();
                if (searchInput) filterProducts(searchInput.value);
            }
        });
    }

    updateCartCount();

    window.addEventListener('storage', (e) => {
        if (e.key === 'alicen_cart') updateCartCount();
    });
});
