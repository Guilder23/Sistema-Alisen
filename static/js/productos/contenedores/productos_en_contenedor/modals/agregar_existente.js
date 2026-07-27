// ================================================================
// MODAL AGREGAR PRODUCTO EXISTENTE A CONTENEDOR
// ================================================================

(function() {
    'use strict';

    let contenedorActualId = null;
    let productosDisponiblesCache = [];
    let listenersInicializados = false;

    function obtenerCSRFToken() {
        const token = document.querySelector('#formAgregarProductoExistente [name=csrfmiddlewaretoken]')
            || document.querySelector('[name=csrfmiddlewaretoken]');
        return token ? (token.value || '') : '';
    }

    function obtenerContenedorIdDesdeBoton(btn) {
        if (!btn) return null;
        return btn.getAttribute('data-contenedor-id') || $(btn).data('contenedor-id') || null;
    }

    function abrirModalAgregarProductoExistente(contenedorId) {
        if (!contenedorId) {
            alert('No se pudo identificar el contenedor.');
            return;
        }

        contenedorActualId = contenedorId;
        const contenedorHidden = document.getElementById('modalContenedorId2');
        if (contenedorHidden) contenedorHidden.value = contenedorId;

        const buscarInput = document.getElementById('producto_buscar_modal');
        const hiddenInput = document.getElementById('producto_id_modal');
        const unidadesInput = document.getElementById('unidades_por_caja_existente_modal');
        const cajasInput = document.getElementById('cantidad_cajas_existente_modal');
        const totalInput = document.getElementById('cantidad_existente_modal');
        const listaContenedor = document.getElementById('producto_lista_modal');
        const ayuda = document.getElementById('producto_buscar_ayuda');

        if (buscarInput) buscarInput.value = '';
        if (hiddenInput) hiddenInput.value = '';
        if (unidadesInput) unidadesInput.value = 1;
        if (cajasInput) cajasInput.value = 1;
        if (totalInput) totalInput.value = 1;
        if (listaContenedor) listaContenedor.innerHTML = '';
        if (ayuda) {
            ayuda.innerHTML = '<i class="fas fa-info-circle"></i> Cargando productos...';
        }

        cargarProductosDisponibles(contenedorId);
        $('#modalAgregarProductoExistente').modal('show');
    }

    window.abrirModalAgregarProductoExistente = abrirModalAgregarProductoExistente;

    function cargarProductosDisponibles(contenedorId) {
        const ayuda = document.getElementById('producto_buscar_ayuda');

        fetch(`/productos/contenedores/${contenedorId}/productos-disponibles/json/`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }

                productosDisponiblesCache = Array.isArray(data.productos) ? data.productos.slice() : [];

                if (ayuda) {
                    if (productosDisponiblesCache.length === 0) {
                        ayuda.innerHTML = '<i class="fas fa-exclamation-circle"></i> No hay productos activos registrados en el sistema.';
                    } else {
                        ayuda.innerHTML = '<i class="fas fa-info-circle"></i> Escribe para buscar. Si ya está en el contenedor, se sumará el stock.';
                    }
                }
            })
            .catch(error => {
                console.error('Error cargando productos:', error);
                productosDisponiblesCache = [];
                if (ayuda) {
                    ayuda.innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i> Error al cargar productos. Recarga la página e intenta de nuevo.';
                }
            });
    }

    function filtrarProductos(termino) {
        termino = (termino || '').toString().trim().toLowerCase();
        const listaContenedor = document.getElementById('producto_lista_modal');
        const buscarInput = document.getElementById('producto_buscar_modal');
        const hiddenInput = document.getElementById('producto_id_modal');
        if (!listaContenedor || !buscarInput) return;

        listaContenedor.innerHTML = '';

        if (!termino) {
            return;
        }

        const filtrados = productosDisponiblesCache.filter(prod => {
            const texto = `${prod.codigo || ''} ${prod.nombre || ''}`.toLowerCase();
            return texto.indexOf(termino) !== -1;
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'producto-lista-overlay';
        wrapper.style.position = 'absolute';
        wrapper.style.top = '100%';
        wrapper.style.left = '0';
        wrapper.style.right = '0';
        wrapper.style.zIndex = '2050';
        wrapper.style.maxHeight = '240px';
        wrapper.style.overflow = 'auto';
        wrapper.style.background = '#fff';
        wrapper.style.border = '1px solid #d1d5db';
        wrapper.style.borderRadius = '0.375rem';
        wrapper.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';

        if (filtrados.length === 0) {
            const noFound = document.createElement('div');
            noFound.className = 'p-2 text-muted';
            noFound.textContent = productosDisponiblesCache.length === 0
                ? 'No hay productos para mostrar.'
                : 'No se encontraron productos con ese texto.';
            wrapper.appendChild(noFound);
            listaContenedor.appendChild(wrapper);
            return;
        }

        const list = document.createElement('div');
        list.className = 'list-group list-group-flush';

        filtrados.slice(0, 50).forEach(prod => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'list-group-item list-group-item-action producto-item';
            const etiquetaExtra = prod.ya_en_contenedor ? ' (ya en contenedor)' : '';
            btn.textContent = `${prod.codigo} - ${prod.nombre}${etiquetaExtra}`;
            btn.dataset.prodId = prod.id;
            btn.dataset.unidadesPorCaja = prod.unidades_por_caja || 1;

            btn.addEventListener('mousedown', function(e) {
                // Evita que el blur del input limpie la lista antes del click
                e.preventDefault();
            });

            btn.addEventListener('click', function() {
                buscarInput.value = `${prod.codigo} - ${prod.nombre}`;
                if (hiddenInput) hiddenInput.value = String(prod.id);
                const unidades = parseInt(prod.unidades_por_caja || '1', 10);
                document.getElementById('unidades_por_caja_existente_modal').value = unidades > 0 ? unidades : 1;
                calcularUnidadesTotalExistente();
                listaContenedor.innerHTML = '';
            });

            list.appendChild(btn);
        });

        wrapper.appendChild(list);
        listaContenedor.appendChild(wrapper);
    }

    function calcularUnidadesTotalExistente() {
        const cantidadCajas = parseInt(document.getElementById('cantidad_cajas_existente_modal').value, 10) || 0;
        const unidadesPorCaja = parseInt(document.getElementById('unidades_por_caja_existente_modal').value, 10) || 1;
        const cantidadInput = document.getElementById('cantidad_existente_modal');
        if (cantidadInput) {
            cantidadInput.value = cantidadCajas * unidadesPorCaja;
        }
    }

    function inicializarListeners() {
        if (listenersInicializados) return;
        listenersInicializados = true;

        const btnAgregarExistente = document.getElementById('btnAgregarExistente');
        if (btnAgregarExistente) {
            btnAgregarExistente.addEventListener('click', function() {
                abrirModalAgregarProductoExistente(obtenerContenedorIdDesdeBoton(this));
            });
        }

        const buscarInput = document.getElementById('producto_buscar_modal');
        const hiddenInput = document.getElementById('producto_id_modal');
        const listaContenedor = document.getElementById('producto_lista_modal');

        if (buscarInput) {
            buscarInput.addEventListener('input', function() {
                if (hiddenInput) hiddenInput.value = '';
                filtrarProductos(this.value);
            });

            buscarInput.addEventListener('focus', function() {
                if (this.value.trim()) {
                    filtrarProductos(this.value);
                }
            });

            buscarInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const primeras = listaContenedor
                        ? listaContenedor.querySelectorAll('button.producto-item')
                        : [];
                    if (primeras.length > 0) {
                        primeras[0].click();
                    }
                }
            });

            buscarInput.addEventListener('blur', function() {
                setTimeout(() => {
                    if (listaContenedor) listaContenedor.innerHTML = '';
                }, 180);
            });
        }

        const cantidadCajasInput = document.getElementById('cantidad_cajas_existente_modal');
        const unidadesPorCajaInput = document.getElementById('unidades_por_caja_existente_modal');

        if (cantidadCajasInput) {
            cantidadCajasInput.addEventListener('input', calcularUnidadesTotalExistente);
            cantidadCajasInput.addEventListener('change', calcularUnidadesTotalExistente);
        }

        if (unidadesPorCajaInput) {
            unidadesPorCajaInput.addEventListener('input', calcularUnidadesTotalExistente);
            unidadesPorCajaInput.addEventListener('change', calcularUnidadesTotalExistente);
        }

        const formAgregarExistente = document.getElementById('formAgregarProductoExistente');
        if (formAgregarExistente) {
            formAgregarExistente.addEventListener('submit', function(e) {
                e.preventDefault();
                const productoId = document.getElementById('producto_id_modal').value;
                const cantidad = parseInt(document.getElementById('cantidad_existente_modal').value, 10) || 0;
                const cantidadCajas = document.getElementById('cantidad_cajas_existente_modal').value;

                if (!productoId || !cantidadCajas || cantidad < 1) {
                    alert('Por favor selecciona un producto e ingresa una cantidad válida de cajas');
                    return;
                }

                const formData = new FormData(this);
                const url = `/productos/contenedores/${contenedorActualId}/agregar-producto/`;

                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': obtenerCSRFToken()
                    },
                    body: formData,
                    credentials: 'same-origin'
                })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            $('#modalAgregarProductoExistente').modal('hide');
                            alert(data.mensaje || 'Producto agregado exitosamente');
                            setTimeout(() => location.reload(), 500);
                        } else {
                            alert('Error: ' + (data.error || 'No se pudo agregar el producto'));
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Error al agregar el producto: ' + error.message);
                    });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarListeners);
    } else {
        inicializarListeners();
    }

    console.log('✓ Modal Agregar Producto Existente inicializado');
})();
