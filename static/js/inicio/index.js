/* ============================================================================
   INDEX.JS - Control de carrito y acciones de inicio
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const addButtons = Array.from(document.querySelectorAll('.btn-add'));
    const whatsappButtons = Array.from(document.querySelectorAll('.btn-whatsapp-buy'));

    const carousel = document.getElementById('homeCarousel');
    if (carousel) {
        const slides = Array.from(carousel.querySelectorAll('.home-carousel-slide'));
        const dots = Array.from(carousel.querySelectorAll('.home-carousel-dots button'));
        const previousButton = carousel.querySelector('.home-carousel-prev');
        const nextButton = carousel.querySelector('.home-carousel-next');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let activeSlide = 0;
        let autoplayTimer;

        const showSlide = (index) => {
            activeSlide = (index + slides.length) % slides.length;
            slides.forEach((slide, slideIndex) => {
                const isActive = slideIndex === activeSlide;
                slide.classList.toggle('is-active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));
                slide.inert = !isActive;
                if (dots[slideIndex]) {
                    dots[slideIndex].classList.toggle('is-active', isActive);
                    dots[slideIndex].setAttribute('aria-current', String(isActive));
                }
            });
        };

        const stopAutoplay = () => window.clearInterval(autoplayTimer);
        const startAutoplay = () => {
            stopAutoplay();
            if (slides.length > 1 && !reducedMotion && !document.hidden) {
                autoplayTimer = window.setInterval(() => showSlide(activeSlide + 1), 5000);
            }
        };

        previousButton?.addEventListener('click', () => {
            showSlide(activeSlide - 1);
            startAutoplay();
        });
        nextButton?.addEventListener('click', () => {
            showSlide(activeSlide + 1);
            startAutoplay();
        });
        dots.forEach((dot, index) => dot.addEventListener('click', () => {
            showSlide(index);
            startAutoplay();
        }));
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        carousel.addEventListener('focusin', stopAutoplay);
        carousel.addEventListener('focusout', startAutoplay);
        document.addEventListener('visibilitychange', startAutoplay);
        startAutoplay();
    }

    // Carrusel infinito de categorías: 1 2 3 1 2 3 ...
    const categoriesTrack = document.getElementById('categoriesTrack');
    const catPrevBtn = document.getElementById('catPrevBtn');
    const catNextBtn = document.getElementById('catNextBtn');

    if (categoriesTrack && catPrevBtn && catNextBtn) {
        const originals = Array.from(categoriesTrack.querySelectorAll('.category-card-slide'));
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let setWidth = 0;
        let looping = false;
        let timer;

        const jump = (left) => categoriesTrack.scrollTo({ left, behavior: 'instant' });

        const setup = () => {
            categoriesTrack.querySelectorAll('[data-clone]').forEach(c => c.remove());
            looping = false;
            categoriesTrack.classList.remove('is-looping');
            categoriesTrack.scrollLeft = 0;
            if (originals.length < 2 || categoriesTrack.scrollWidth <= categoriesTrack.clientWidth + 1) {
                catPrevBtn.classList.add('is-hidden');
                catNextBtn.classList.add('is-hidden');
                return;
            }
            const gap = parseFloat(getComputedStyle(categoriesTrack).columnGap) || 10;
            setWidth = originals.reduce((sum, c) => sum + c.getBoundingClientRect().width + gap, 0);
            const copies = Math.ceil(categoriesTrack.clientWidth / setWidth) + 1;
            for (let i = 0; i < copies; i++) {
                originals.forEach(card => {
                    const clone = card.cloneNode(true);
                    clone.dataset.clone = 'true';
                    clone.setAttribute('aria-hidden', 'true');
                    clone.tabIndex = -1;
                    categoriesTrack.appendChild(clone);
                });
            }
            categoriesTrack.classList.add('is-looping');
            catPrevBtn.classList.remove('is-hidden');
            catNextBtn.classList.remove('is-hidden');
            looping = true;
        };

        const step = () => {
            const card = categoriesTrack.querySelector('.category-card-slide');
            const gap = parseFloat(getComputedStyle(categoriesTrack).columnGap) || 10;
            return card.getBoundingClientRect().width + gap;
        };

        const normalize = () => {
            if (!looping) return;
            if (categoriesTrack.scrollLeft >= setWidth) jump(categoriesTrack.scrollLeft - setWidth);
        };

        const move = (dir) => {
            if (!looping) return;
            if (dir < 0 && categoriesTrack.scrollLeft < step()) jump(categoriesTrack.scrollLeft + setWidth);
            categoriesTrack.scrollBy({ left: dir * step(), behavior: 'smooth' });
        };

        const stop = () => window.clearInterval(timer);
        const start = () => {
            stop();
            if (looping && !reduced && !document.hidden) timer = window.setInterval(() => move(1), 2500);
        };

        catPrevBtn.addEventListener('click', () => { move(-1); start(); });
        catNextBtn.addEventListener('click', () => { move(1); start(); });
        categoriesTrack.addEventListener('scroll', () => {
            window.clearTimeout(categoriesTrack._normTimer);
            categoriesTrack._normTimer = window.setTimeout(normalize, 120);
        }, { passive: true });
        ['mouseenter', 'touchstart', 'focusin'].forEach(evt => categoriesTrack.addEventListener(evt, stop, { passive: true }));
        ['mouseleave', 'touchend', 'focusout'].forEach(evt => categoriesTrack.addEventListener(evt, start, { passive: true }));
        document.addEventListener('visibilitychange', start);
        let resizeTimer;
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(() => { setup(); start(); }, 200);
        });
        setup();
        start();
    }
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
