import re

from .models import ProductoImagen


def extraer_youtube_id(url):
    if not url:
        return None
    url = url.strip()
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([\w-]{11})',
        r'youtube\.com/watch\?.*v=([\w-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def youtube_embed_url(url):
    video_id = extraer_youtube_id(url)
    if video_id:
        return f'https://www.youtube.com/embed/{video_id}'
    return None


def _asegurar_imagen_principal(producto):
    imagenes = list(producto.imagenes.order_by('orden', 'id'))
    if not imagenes:
        return
    principales = [img for img in imagenes if img.es_principal]
    if len(principales) == 1:
        return
    elegida = principales[0] if principales else imagenes[0]
    producto.imagenes.exclude(id=elegida.id).update(es_principal=False)
    if not elegida.es_principal:
        elegida.es_principal = True
        elegida.save(update_fields=['es_principal'])


def _obtener_archivos_imagen(request):
    archivos = request.FILES.getlist('imagenes')
    if not archivos:
        archivos = request.FILES.getlist('imagenes[]')
    return [archivo for archivo in archivos if archivo]


def guardar_media_producto(producto, request):
    """Procesa imágenes múltiples, eliminaciones y video de YouTube."""
    video = request.POST.get('video_youtube')
    if video is not None:
        video = video.strip()
        producto.video_youtube = video or None

    eliminar_ids = [i for i in request.POST.getlist('eliminar_imagenes') if str(i).isdigit()]
    if eliminar_ids:
        producto.imagenes.filter(id__in=eliminar_ids).delete()

    principal_id = request.POST.get('imagen_principal_id', '').strip()
    if principal_id.isdigit():
        producto.imagenes.update(es_principal=False)
        producto.imagenes.filter(id=int(principal_id)).update(es_principal=True)

    nuevas = _obtener_archivos_imagen(request)
    if nuevas:
        principal_nueva = request.POST.get('imagen_principal_nueva', '')
        max_orden = producto.imagenes.count()
        tiene_principal = producto.imagenes.filter(es_principal=True).exists()

        for index, archivo in enumerate(nuevas):
            es_principal = False
            if principal_nueva != '':
                es_principal = str(index) == str(principal_nueva)
            elif not tiene_principal and index == 0:
                es_principal = True

            if es_principal:
                producto.imagenes.update(es_principal=False)
                tiene_principal = True

            ProductoImagen.objects.create(
                producto=producto,
                imagen=archivo,
                es_principal=es_principal,
                orden=max_orden + index,
            )

    if not producto.imagenes.exists() and producto.foto:
        ProductoImagen.objects.create(
            producto=producto,
            imagen=producto.foto,
            es_principal=True,
            orden=0,
        )

    _asegurar_imagen_principal(producto)
    producto.sync_foto_desde_imagenes()

    if video is not None:
        producto.save(update_fields=['video_youtube', 'fecha_actualizacion'])


def serializar_imagenes_producto(producto):
    return [
        {
            'id': img.id,
            'url': img.imagen.url,
            'es_principal': img.es_principal,
            'orden': img.orden,
        }
        for img in producto.imagenes.all()
    ]
