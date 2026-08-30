/* ============================================================================
   NAVBAR PRINCIPAL & BOTTOM NAVIGATION JS
   ============================================================================ */

// Ajusta dinámicamente --navbar-height según la altura real del navbar fijo,
// para que el contenido nunca quede oculto detrás de él en ningún tamaño de pantalla.
function ajustarAlturaNavbarPrincipal() {
    const navbar = document.querySelector('.navbar-principal');
    if (!navbar) return;
    const alturaReal = Math.ceil(navbar.getBoundingClientRect().height);
    if (alturaReal > 0) {
        document.documentElement.style.setProperty('--navbar-height', `${alturaReal}px`);
    }
}

window.addEventListener('load', ajustarAlturaNavbarPrincipal);
window.addEventListener('resize', ajustarAlturaNavbarPrincipal);
document.addEventListener('DOMContentLoaded', ajustarAlturaNavbarPrincipal);

document.addEventListener('DOMContentLoaded', () => {
    ajustarAlturaNavbarPrincipal();
    // Reajustar tras un breve delay por si las fuentes/íconos cambian el alto inicial
    setTimeout(ajustarAlturaNavbarPrincipal, 150);
    setTimeout(ajustarAlturaNavbarPrincipal, 500);

    // Badges de Carrito en Header, Mobile Header, Sidebar y Bottom Nav
    const cartCountEl = document.getElementById('cartCount');
    const mobileCartCountEl = document.getElementById('mobileCartCount');
    const sidebarCartCountEl = document.getElementById('sidebarCartCount');
    const bottomCartCountEl = document.getElementById('bottomCartCount');

    const mayoristaPage = document.body.classList.contains('tienda-mayorista-page')
        || document.body.classList.contains('carrito-mayorista-page')
        || document.body.classList.contains('detalle-mayorista-page')
        || window.location.pathname.includes('mayorista');

    const cartKey = mayoristaPage ? 'alicen_cart_mayorista' : 'alicen_cart';

    // Ajustar enlaces de carrito si estamos en modo mayorista
    if (mayoristaPage) {
        document.querySelectorAll('.js-cart-link').forEach((link) => {
            link.href = '/carrito-mayorista/';
            link.title = 'Carrito Mayorista';
        });
    }

    // Identificar y activar el botón correspondiente en la barra inferior móvil
    const currentPath = window.location.pathname;
    const navInicio = document.getElementById('bottomNavInicio');
    const navTienda = document.getElementById('bottomNavTienda');
    const navMayorista = document.getElementById('bottomNavMayorista');
    const navCarrito = document.getElementById('bottomNavCarrito');

    // Remover active por defecto
    [navInicio, navTienda, navMayorista, navCarrito].forEach(el => el?.classList.remove('active'));

    if (currentPath === '/' || currentPath === '') {
        navInicio?.classList.add('active');
    } else if (currentPath.includes('mayorista')) {
        if (currentPath.includes('carrito')) {
            navCarrito?.classList.add('active');
        } else {
            navMayorista?.classList.add('active');
        }
    } else if (currentPath.includes('carrito')) {
        navCarrito?.classList.add('active');
    } else if (currentPath.includes('tienda') || currentPath.includes('producto') || currentPath.includes('product')) {
        navTienda?.classList.add('active');
    }

    // Funcionalidad de Carrito y conteo
    const getCart = () => {
        try { 
            return JSON.parse(localStorage.getItem(cartKey) || '{}'); 
        } catch { 
            return {}; 
        }
    };

    const updateCartCount = () => {
        const cart = getCart();
        const count = Object.values(cart).reduce((sum, it) => sum + (it.cantidad || 0), 0);
        
        [cartCountEl, mobileCartCountEl, sidebarCartCountEl, bottomCartCountEl].forEach(el => {
            if (el) {
                el.textContent = count;
                el.style.display = count > 0 ? 'inline-flex' : (el.id === 'bottomCartCount' ? 'none' : 'inline-flex');
            }
        });
    };

    // Mobile Sidebar functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarOverlay = document.getElementById('mobileSidebarOverlay');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');

    const toggleMobileSidebar = (forceState) => {
        if (!mobileSidebar || !mobileSidebarOverlay) return;
        const shouldOpen = typeof forceState === 'boolean' 
            ? forceState 
            : !mobileSidebar.classList.contains('active');
            
        mobileSidebar.classList.toggle('active', shouldOpen);
        mobileSidebarOverlay.classList.toggle('active', shouldOpen);
        document.body.style.overflow = shouldOpen ? 'hidden' : '';
    };

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => toggleMobileSidebar(true));
    }
    if (mobileSidebarClose) {
        mobileSidebarClose.addEventListener('click', () => toggleMobileSidebar(false));
    }
    if (mobileSidebarOverlay) {
        mobileSidebarOverlay.addEventListener('click', () => toggleMobileSidebar(false));
    }

    // Cerrar sidebar al hacer click en enlaces internos
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => toggleMobileSidebar(false));
    });

    // Búsqueda en vivo si hay tarjetas de producto en el DOM
    const searchInput = document.getElementById('navbarSearchInput');
    const searchForm = document.getElementById('navbarSearchForm');
    const productCards = Array.from(document.querySelectorAll('.product-card'));

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

    // Inicializar conteo
    updateCartCount();

    // Sincronizar cambios de LocalStorage en otras pestañas
    window.addEventListener('storage', (e) => {
        if (e.key === cartKey || e.key === 'alicen_cart' || e.key === 'alicen_cart_mayorista') {
            updateCartCount();
        }
    });

    // Evento custom para actualizar badge inmediatamente tras agregar producto
    window.addEventListener('cartUpdated', () => {
        updateCartCount();
    });
});
