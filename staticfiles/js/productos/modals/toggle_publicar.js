/* ============================================================================
   TOGGLE_PUBLICAR.JS - Modal para confirmar publicar/despublicar
   ============================================================================ */

(function () {
    let productoActual = null;
    let accionActual = null;
    let botonOrigen = null;

    const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    const mostrarToast = (mensaje, tipo = 'success', titulo = '') => {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        const iconClass = tipo === 'success' ? 'fa-check' : 'fa-exclamation-triangle';
        const titleText = titulo || (tipo === 'success' ? 'Correcto' : 'Atención');
        toast.style.cssText = `
            position: fixed; top: 22px; right: 22px; z-index: 99999;
            min-width: 280px; max-width: 380px;
            background: #ffffff; border: 1px solid rgba(148,163,184,0.18);
            border-left: 4px solid ${tipo === 'success' ? '#16c784' : '#ef4444'};
            border-radius: 18px; padding: 1rem 1.15rem;
            box-shadow: 0 20px 60px rgba(15,23,42,0.22);
            display: flex; align-items: center; gap: 0.85rem;
            animation: toastSlideIn 0.35s cubic-bezier(.2,.8,.2,1);
        `;
        toast.innerHTML = `
            <div style="width: 38px; height: 38px; border-radius: 12px;
                display: inline-flex; align-items: center; justify-content: center;
                font-size: 1.05rem; color: #fff; flex-shrink: 0;
                background: linear-gradient(135deg, ${tipo === 'success' ? '#16c784, #25d366' : '#ef4444, #f87171'});">
                <i class="fas ${iconClass}"></i>
            </div>
            <div style="flex: 1;">
                <strong style="display: block; color: #0f172a; font-size: 0.9rem;">${titleText}</strong>
                <small style="color: #64748b; font-size: 0.78rem;">${mensaje}</small>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 350);
        }, 2800);
    };

    const actualizarBotonYTabla = (productoId, esPublicado) => {
        const btn = document.querySelector(`.btn-toggle-publish[data-product-id="${productoId}"]`);
        if (btn) {
            btn.dataset.action = esPublicado ? 'despublicar' : 'publicar';
            btn.title = esPublicado ? 'Despublicar' : 'Publicar';
            btn.classList.remove('btn-outline-success', 'btn-outline-danger');
            btn.classList.add(esPublicado ? 'btn-outline-success' : 'btn-outline-danger');
            const icon = btn.querySelector('i');
            if (icon) icon.className = `fas fa-toggle-${esPublicado ? 'on' : 'off'}`;
            const txtSpan = btn.querySelector('span');
            if (txtSpan) txtSpan.textContent = esPublicado ? 'Despublicar' : 'Publicar';
            else {
                const labelText = esPublicado ? 'Despublicar' : 'Publicar';
                const newHtml = `<i class="fas fa-toggle-${esPublicado ? 'on' : 'off'}"></i> ${labelText}`;
                if (!btn.dataset.productIdAlone) btn.innerHTML = newHtml;
            }
        }
        const fila = btn ? btn.closest('tr') : null;
        if (fila) {
            const badgePublica = fila.querySelector('.badge-publica');
            if (badgePublica) {
                if (esPublicado) {
                    badgePublica.className = 'badge-publica badge-publica-publicado';
                    badgePublica.innerHTML = '<i class="fas fa-check-circle"></i> Publicado';
                } else {
                    badgePublica.className = 'badge-publica badge-publica-despublicado';
                    badgePublica.innerHTML = '<i class="fas fa-times-circle"></i> Despublicado';
                }
            }
        }
    };

    const abrirModal = (btn) => {
        const productId = btn.dataset.productId;
        const action = btn.dataset.action;
        botonOrigen = btn;
        accionActual = action;
        productoActual = productId;

        const modal = document.getElementById('modalTogglePublicar');
        if (!modal) return;

        const modalDialog = modal.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.classList.remove('modal-publicar', 'modal-despublicar');
            modalDialog.classList.add(action === 'publicar' ? 'modal-publicar' : 'modal-despublicar');
        }

        const fila = btn.closest('tr');
        const fotoSrc = fila ? (fila.querySelector('.producto-imagen-tabla')?.getAttribute('src') || '') : '';
        const codigo = fila ? (fila.querySelector('.codigo-badge')?.textContent?.trim() || '') : '';
        const nombre = fila ? (fila.querySelector('td:nth-child(3)')?.textContent?.trim() || '') : '';

        document.getElementById('modalToggleFoto').src = fotoSrc || '/static/img/logoAlmacen.png';
        document.getElementById('modalToggleCodigo').textContent = codigo;
        document.getElementById('modalToggleNombre').textContent = nombre;

        if (action === 'publicar') {
            document.getElementById('modalToggleTitleText').textContent = 'Publicar Producto';
            document.getElementById('modalToggleSubtitleText').textContent = 'Este producto se mostrará en la tienda virtual y catálogo.';
            document.getElementById('modalToggleAlertTitle').textContent = '¿Deseas publicar este producto?';
            document.getElementById('modalToggleAlertDesc').textContent = 'Al confirmar, el producto estará visible para los clientes de la tienda virtual.';
            document.getElementById('modalToggleConfirmarText').textContent = 'Publicar';
            document.querySelector('#modalToggleIconWrapper i').className = 'fas fa-bullhorn';
        } else {
            document.getElementById('modalToggleTitleText').textContent = 'Despublicar Producto';
            document.getElementById('modalToggleSubtitleText').textContent = 'Este producto se ocultará de la tienda virtual y catálogo.';
            document.getElementById('modalToggleAlertTitle').textContent = '¿Deseas despublicar este producto?';
            document.getElementById('modalToggleAlertDesc').textContent = 'Al confirmar, el producto ya no estará visible en la tienda virtual. El producto seguirá estando activo en el sistema.';
            document.getElementById('modalToggleConfirmarText').textContent = 'Despublicar';
            document.querySelector('#modalToggleIconWrapper i').className = 'fas fa-eye-slash';
        }

        $('#modalTogglePublicar').modal('show');
    };

    const confirmarAccion = async () => {
        if (!productoActual || !accionActual) return;

        const confirmBtn = document.getElementById('modalToggleConfirmar');
        const originalHtml = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.classList.add('btn-toggle-loading');
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Procesando...';

        try {
            const url = accionActual === 'publicar'
                ? `/productos/${productoActual}/publicar/`
                : `/productos/${productoActual}/despublicar/`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const data = await response.json();

            if (response.ok && data.success) {
                actualizarBotonYTabla(productoActual, data.publicado);
                mostrarToast(
                    `Producto ${data.publicado ? 'publicado' : 'despublicado'} correctamente`,
                    'success',
                    document.getElementById('modalToggleNombre').textContent
                );
                $('#modalTogglePublicar').modal('hide');
            } else {
                mostrarToast(data.error || 'Error al procesar la acción', 'error', 'Ocurrió un problema');
            }
        } catch (err) {
            mostrarToast('Error de conexión. Inténtelo nuevamente.', 'error', 'Sin conexión');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('btn-toggle-loading');
            confirmBtn.innerHTML = originalHtml;
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.btn-toggle-publish').forEach(btn => {
            btn.removeEventListener('click', _handlerPrev);
            btn.addEventListener('click', _handlerPrev = (e) => {
                e.preventDefault();
                abrirModal(btn);
            });
        });

        const confirmBtn = document.getElementById('modalToggleConfirmar');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmarAccion);
        }
    });

    let _handlerPrev = null;
})();
