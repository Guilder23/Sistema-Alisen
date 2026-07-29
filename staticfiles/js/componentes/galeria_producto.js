(function() {
    'use strict';

    const filesMap = new WeakMap();

    function getFiles(formGroup) {
        if (!filesMap.has(formGroup)) {
            filesMap.set(formGroup, []);
        }
        return filesMap.get(formGroup);
    }

    function setFiles(formGroup, files) {
        filesMap.set(formGroup, files);
        syncFileInput(formGroup);
    }

    function syncFileInput(formGroup) {
        const input = formGroup.querySelector('.input-imagenes');
        if (!input) return;
        const dt = new DataTransfer();
        getFiles(formGroup).forEach((file) => dt.items.add(file));
        try {
            input.files = dt.files;
        } catch (err) {
            // Algunos navegadores restringen la asignación; se enviará vía appendFilesToFormData.
        }
    }

    function renderPreview(formGroup) {
        const preview = formGroup.querySelector('.galeria-preview');
        const principalNueva = formGroup.querySelector('.imagen-principal-nueva');
        const principalId = formGroup.querySelector('.imagen-principal-id');
        const files = getFiles(formGroup);
        preview.innerHTML = '';

        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'galeria-preview-item';
            if (String(principalNueva.value) === String(index) && !principalId.value) {
                item.classList.add('principal');
            }

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = file.name;
            img.title = 'Clic para marcar como principal';
            img.addEventListener('click', () => {
                principalNueva.value = String(index);
                principalId.value = '';
                formGroup.querySelectorAll('.galeria-item').forEach((el) => el.classList.remove('principal'));
                renderPreview(formGroup);
                renderExistentes(formGroup);
            });

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'galeria-btn-eliminar';
            btn.innerHTML = '&times;';
            btn.title = 'Quitar imagen';
            btn.addEventListener('click', () => {
                const updated = getFiles(formGroup).filter((_, i) => i !== index);
                setFiles(formGroup, updated);
                if (parseInt(principalNueva.value, 10) === index) {
                    principalNueva.value = updated.length ? '0' : '';
                } else if (parseInt(principalNueva.value, 10) > index) {
                    principalNueva.value = String(parseInt(principalNueva.value, 10) - 1);
                }
                renderPreview(formGroup);
            });

            if (item.classList.contains('principal')) {
                const badge = document.createElement('span');
                badge.className = 'galeria-badge-principal';
                badge.textContent = 'Principal';
                item.appendChild(badge);
            }

            item.appendChild(img);
            item.appendChild(btn);
            preview.appendChild(item);
        });
    }

    function renderExistentes(formGroup) {
        const container = formGroup.querySelector('.galeria-existentes');
        const principalId = formGroup.querySelector('.imagen-principal-id');
        const principalNueva = formGroup.querySelector('.imagen-principal-nueva');
        const imagenes = JSON.parse(formGroup.dataset.imagenes || '[]');

        container.innerHTML = '';
        imagenes.forEach((img) => {
            if (formGroup.querySelector(`input[name="eliminar_imagenes"][value="${img.id}"]`)) {
                return;
            }

            const item = document.createElement('div');
            item.className = 'galeria-item';
            if (String(principalId.value) === String(img.id)) {
                item.classList.add('principal');
            }

            const image = document.createElement('img');
            image.src = img.url;
            image.alt = 'Imagen del producto';
            image.title = 'Clic para marcar como principal';
            image.addEventListener('click', () => {
                principalId.value = String(img.id);
                principalNueva.value = '';
                renderExistentes(formGroup);
                renderPreview(formGroup);
            });

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'galeria-btn-eliminar';
            btn.innerHTML = '&times;';
            btn.title = 'Eliminar imagen';
            btn.addEventListener('click', () => {
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = 'eliminar_imagenes';
                hidden.value = String(img.id);
                formGroup.appendChild(hidden);
                const restantes = imagenes.filter((i) => i.id !== img.id);
                formGroup.dataset.imagenes = JSON.stringify(restantes);
                if (String(principalId.value) === String(img.id)) {
                    principalId.value = restantes.length ? String(restantes[0].id) : '';
                }
                renderExistentes(formGroup);
            });

            if (item.classList.contains('principal')) {
                const badge = document.createElement('span');
                badge.className = 'galeria-badge-principal';
                badge.textContent = 'Principal';
                item.appendChild(badge);
            }

            item.appendChild(image);
            item.appendChild(btn);
            container.appendChild(item);
        });
    }

    function initGaleriaForm(formGroup) {
        if (!formGroup || formGroup.dataset.galeriaInit === '1') return;
        formGroup.dataset.galeriaInit = '1';

        const btn = formGroup.querySelector('.btn-agregar-imagenes');
        const input = formGroup.querySelector('.input-imagenes');
        const principalNueva = formGroup.querySelector('.imagen-principal-nueva');
        const principalId = formGroup.querySelector('.imagen-principal-id');

        btn?.addEventListener('click', () => input?.click());

        input?.addEventListener('change', () => {
            const nuevos = Array.from(input.files || []);
            if (!nuevos.length) return;

            const actuales = getFiles(formGroup);
            setFiles(formGroup, actuales.concat(nuevos));

            if (!principalId.value && principalNueva.value === '') {
                principalNueva.value = '0';
            }

            input.value = '';
            renderPreview(formGroup);
        });

        renderExistentes(formGroup);
        renderPreview(formGroup);
    }

    function appendFilesToFormData(formGroup, formData) {
        formData.delete('imagenes');
        getFiles(formGroup).forEach((file) => {
            formData.append('imagenes', file, file.name);
        });

        const form = formGroup.closest('form');
        const videoInput = form?.querySelector('.input-video-youtube');
        if (videoInput) {
            formData.set('video_youtube', videoInput.value.trim());
        }

        const principalId = formGroup.querySelector('.imagen-principal-id');
        const principalNueva = formGroup.querySelector('.imagen-principal-nueva');
        if (principalId) {
            formData.set('imagen_principal_id', principalId.value || '');
        }
        if (principalNueva) {
            formData.set('imagen_principal_nueva', principalNueva.value ?? '');
        }

        formGroup.querySelectorAll('input[name="eliminar_imagenes"]').forEach((input) => {
            formData.append('eliminar_imagenes', input.value);
        });

        return formData;
    }

    window.GaleriaProducto = {
        init(container) {
            (container || document).querySelectorAll('.galeria-producto-form').forEach(initGaleriaForm);
        },

        buildFormData(form) {
            const formData = new FormData(form);
            const formGroup = form.querySelector('.galeria-producto-form');
            if (formGroup) {
                appendFilesToFormData(formGroup, formData);
            }
            return formData;
        },

        reset(container) {
            (container || document).querySelectorAll('.galeria-producto-form').forEach((formGroup) => {
                delete formGroup.dataset.galeriaInit;
                formGroup.dataset.imagenes = '[]';
                formGroup.querySelector('.imagen-principal-id').value = '';
                formGroup.querySelector('.imagen-principal-nueva').value = '0';
                formGroup.querySelector('.galeria-preview').innerHTML = '';
                formGroup.querySelector('.galeria-existentes').innerHTML = '';
                formGroup.querySelectorAll('input[name="eliminar_imagenes"]').forEach((el) => el.remove());
                setFiles(formGroup, []);
            });
            (container || document).querySelectorAll('.input-video-youtube').forEach((el) => {
                el.value = '';
            });
        },

        loadData(container, data) {
            const root = typeof container === 'string' ? document.querySelector(container) : container;
            const formGroup = root?.querySelector('.galeria-producto-form');
            if (!formGroup) return;

            delete formGroup.dataset.galeriaInit;
            initGaleriaForm(formGroup);

            formGroup.dataset.imagenes = JSON.stringify(data.imagenes || []);
            const principal = (data.imagenes || []).find((img) => img.es_principal);
            formGroup.querySelector('.imagen-principal-id').value = principal ? String(principal.id) : '';
            formGroup.querySelector('.imagen-principal-nueva').value = '';
            setFiles(formGroup, []);
            renderExistentes(formGroup);
            renderPreview(formGroup);

            const videoInput = root.querySelector('.input-video-youtube');
            if (videoInput) {
                videoInput.value = data.video_youtube || '';
            }
        },

        renderVer(container, data) {
            const root = typeof container === 'string' ? document.querySelector(container) : container;
            const fotoWrap = root?.querySelector('.galeria-ver-principal');
            const grid = root?.querySelector('.galeria-ver-grid');
            const videoWrap = root?.querySelector('.galeria-ver-video');
            if (!fotoWrap) return;

            const imagenes = data.imagenes || [];
            const principal = imagenes.find((img) => img.es_principal) || imagenes[0];
            const urlPrincipal = principal?.url || data.foto || '';

            if (urlPrincipal) {
                fotoWrap.innerHTML = `<img src="${urlPrincipal}" alt="${data.nombre || 'Producto'}" class="img-fluid rounded" style="max-width:100%;max-height:300px;object-fit:cover;border:2px solid #e5e7eb;">`;
            } else {
                fotoWrap.innerHTML = '<div class="bg-light rounded d-flex align-items-center justify-content-center" style="height:200px;border:2px dashed #d1d5db;"><div class="text-center text-muted"><i class="fas fa-image fa-2x mb-2"></i><p class="mb-0 small">Sin imagen</p></div></div>';
            }

            if (grid) {
                const secundarias = imagenes.filter((img) => img.url !== urlPrincipal);
                grid.innerHTML = secundarias.map((img) =>
                    `<img src="${img.url}" alt="Imagen" class="${img.es_principal ? 'principal' : ''}" title="Imagen adicional">`
                ).join('');
                grid.style.display = secundarias.length ? 'flex' : 'none';
            }

            if (videoWrap) {
                if (data.video_youtube_embed) {
                    videoWrap.innerHTML = `<iframe src="${data.video_youtube_embed}" allowfullscreen loading="lazy" title="Video del producto"></iframe>`;
                    videoWrap.style.display = 'block';
                } else {
                    videoWrap.innerHTML = '';
                    videoWrap.style.display = 'none';
                }
            }
        }
    };
})();
