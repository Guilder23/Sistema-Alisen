"""Combina los comprobantes generados con la plantilla visual del negocio."""

import copy
import os
from io import BytesIO

from django.conf import settings
from pypdf import PdfReader, PdfWriter, Transformation


TEMPLATE_PATH = os.path.join(
    settings.BASE_DIR,
    'static',
    'plantillas',
    'ventas_proformas.pdf',
)


def aplicar_plantilla_comprobante(pdf_buffer, desplazamiento_vertical=0):
    """Aplica la plantilla y eleva ligeramente el contenido del comprobante."""
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f'No se encontró la plantilla PDF: {TEMPLATE_PATH}')

    pdf_buffer.seek(0)
    contenido = PdfReader(pdf_buffer)
    plantilla = PdfReader(TEMPLATE_PATH)
    if not contenido.pages:
        raise ValueError('El PDF generado no contiene páginas.')
    if not plantilla.pages:
        raise ValueError('La plantilla PDF no contiene páginas.')

    pagina_plantilla = plantilla.pages[0]
    ancho = float(contenido.pages[0].mediabox.width)
    alto = float(contenido.pages[0].mediabox.height)
    salida = PdfWriter()
    for pagina in contenido.pages:
        fondo = copy.deepcopy(pagina_plantilla)
        fondo.scale_to(ancho, alto)
        fondo.merge_transformed_page(
            pagina,
            Transformation().translate(tx=0, ty=desplazamiento_vertical),
            over=True,
        )
        salida.add_page(fondo)

    resultado = BytesIO()
    salida.write(resultado)
    resultado.seek(0)
    return resultado
