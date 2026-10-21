document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('administrarPaginaModal');
    if (!modalElement) {
        return;
    }

    const modal = jQuery(modalElement);
    const modalContent = modalElement.querySelector('.modal-content');

    function inicializarVistaPreviaTienda() {
        const select = document.getElementById('id_tienda');
        const dataElement = document.getElementById('tiendas-pagina-data');
        const preview = document.getElementById('tienda-seleccionada');
        if (!select || !dataElement || !preview) {
            return;
        }

        const tiendas = JSON.parse(dataElement.textContent);
        const actualizarVistaPrevia = function () {
            const tienda = tiendas.find((item) => String(item.id) === select.value);
            preview.hidden = !tienda;
            if (!tienda) {
                return;
            }

            document.getElementById('tienda-preview-nombre').textContent = tienda.nombre;
            document.getElementById('tienda-preview-tipo').textContent = tienda.tipo;
            document.getElementById('tienda-preview-direccion').textContent =
                `${tienda.direccion}, ${tienda.ciudad}, ${tienda.departamento}`;
            document.getElementById('tienda-preview-estado').textContent = tienda.estado;
            document.getElementById('tienda-preview-descripcion').textContent =
                tienda.descripcion || 'No hay descripción registrada.';

            const fotoPreview = document.getElementById('tienda-preview-foto');
            fotoPreview.hidden = !tienda.foto;
            fotoPreview.src = tienda.foto || '';
            fotoPreview.alt = tienda.foto ? `Foto actual de ${tienda.nombre}` : '';

            const mapsLink = document.getElementById('tienda-preview-maps');
            mapsLink.hidden = !tienda.maps;
            mapsLink.href = tienda.maps || '#';
        };

        select.addEventListener('change', actualizarVistaPrevia);
        actualizarVistaPrevia();
    }

    inicializarVistaPreviaTienda();
    modalElement.addEventListener('admin-modal-content-loaded', inicializarVistaPreviaTienda);

    async function loadModal(url, show = true) {
        modalContent.innerHTML = '<div class="modal-body text-center py-5"><span class="spinner-border text-primary" role="status"></span></div>';
        if (show) {
            modal.modal('show');
        }

        const response = await fetch(url, {
            headers: {'X-Requested-With': 'XMLHttpRequest'},
        });
        if (!response.ok) {
            throw new Error('No se pudo cargar el formulario solicitado.');
        }
        modalContent.innerHTML = await response.text();
        modalElement.dispatchEvent(new CustomEvent('admin-modal-content-loaded'));
    }

    document.addEventListener('click', function (event) {
        const trigger = event.target.closest('[data-modal-url]');
        if (!trigger) {
            return;
        }
        event.preventDefault();
        loadModal(trigger.dataset.modalUrl).catch((error) => {
            modalContent.innerHTML = `<div class="modal-body"><div class="alert alert-danger mb-0">${error.message}</div></div>`;
            modal.modal('show');
        });
    });

    modalElement.addEventListener('submit', async function (event) {
        const form = event.target.closest('[data-modal-form]');
        if (!form) {
            return;
        }
        event.preventDefault();
        if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) {
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
        }
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {'X-Requested-With': 'XMLHttpRequest'},
            });
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const result = await response.json();
                if (!response.ok || !result.ok) {
                    throw new Error('No se pudo guardar la tienda.');
                }
                window.location.assign(result.redirect_url);
                return;
            }

            modalContent.innerHTML = await response.text();
            modalElement.dispatchEvent(new CustomEvent('admin-modal-content-loaded'));
        } catch (error) {
            const errorBox = document.createElement('div');
            errorBox.className = 'alert alert-danger m-3';
            errorBox.textContent = error.message;
            modalContent.prepend(errorBox);
        } finally {
            if (submitButton && document.contains(submitButton)) {
                submitButton.disabled = false;
            }
        }
    });
});
