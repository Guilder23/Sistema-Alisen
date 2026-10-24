document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.about-feature');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 80}ms`;
        card.classList.add('fade-in-up');
    });

    const modal = document.getElementById('modalTiendaPublica');
    if (!modal) {
        return;
    }

    jQuery(modal).on('show.bs.modal', function (event) {
        const trigger = event.relatedTarget;
        if (!trigger) {
            return;
        }

        document.getElementById('modalTiendaPublicaTitulo').textContent = trigger.dataset.tiendaNombre || '';
        document.getElementById('modalTiendaPublicaDireccion').textContent = trigger.dataset.tiendaDireccion || '';
        document.getElementById('modalTiendaPublicaDescripcion').textContent = trigger.dataset.tiendaDescripcion || '';

        const mapsLink = document.getElementById('modalTiendaPublicaMaps');
        const mapsUrl = trigger.dataset.tiendaMaps || '';
        mapsLink.href = mapsUrl || '#';
        mapsLink.hidden = !mapsUrl;
    });
});
