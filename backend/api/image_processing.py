"""
Normalización de imágenes subidas (insignias, avatares y foto de perfil).

## Por qué el servidor y no solo el cliente

El cliente (`BadgesAdminPanel.jsx`) exigía insignias de 80x80 exactos, pero
tres de las diez insignias guardadas en producción medían 1024x1024 o
256x256: esa comprobación se salta con el admin de Django o llamando a la
API directamente, así que no era una validación real. El principio que
implementa este módulo es "el servidor es la autoridad y normaliza; el
cliente solo avisa temprano": aquí se decide el tamaño final, y el cliente
puede seguir avisando pero ya no bloqueando.

## Por qué se conserva el formato de archivo en vez de convertir todo a WEBP

El defecto medido es el tamaño en **píxeles** (un icono de 1024x1024 pintado
en una caja de 64px), no el formato de archivo: las insignias ya usan
PNG/WEBP (necesitan canal alfa) y los avatares ya usan JPEG (fotos sin
transparencia). Convertir todo a WEBP ahorraría algunos KB adicionales, pero
obligaría a reescribir la extensión guardada en el campo (con el riesgo de
que quede desincronizada del archivo real en disco) sin resolver nada que no
resuelva ya achicar las dimensiones. Se deja fuera a propósito.

## Dónde vive esto

Se engancha con la señal `pre_save` (ver `api/models.py`) en vez de vivir
solo en el serializer: `pre_save` se dispara tanto si el objeto se guarda vía
API/DRF como si se guarda desde el admin de Django, e incluso durante un
`loaddata` de fixtures (que llama a `Model.save_base()` directamente,
saltándose cualquier `Model.save()` sobrescrito, pero no las señales). Así
una imagen mal dimensionada no puede colarse por ninguna de esas vías.
"""
import logging
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

# Insignias: se pintan en cajas fijas de icono (64px en el perfil, 96px en el
# panel de admin). 80x80 es la medida que ya pedía el cliente; el servidor
# ahora la aplica de verdad, recortando al cuadrado central antes de escalar
# para no deformar el icono.
BADGE_SIZE = (80, 80)

# Avatares y foto de perfil: se pintan entre 48 y 128px según la pantalla.
# 256px es 4x la caja más grande usada hoy, suficiente para pantallas de alta
# densidad sin arrastrar archivos de varios MB como ocurría con los de
# 640x640 y 736x736 medidos en producción.
AVATAR_MAX_SIZE = (256, 256)

_EXTENSION_A_FORMATO_PIL = {
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'png': 'PNG',
    'webp': 'WEBP',
    'gif': 'GIF',
}


def _formato_pil(nombre_archivo, formato_original):
    """Elige el formato de guardado de Pillow a partir de la extensión del nombre."""
    ext = nombre_archivo.rsplit('.', 1)[-1].lower() if nombre_archivo and '.' in nombre_archivo else ''
    return _EXTENSION_A_FORMATO_PIL.get(ext, formato_original or 'PNG')


def _recortar_a_cuadrado(imagen):
    """Recorta al cuadrado central más grande posible, sin deformar el contenido."""
    ancho, alto = imagen.size
    lado = min(ancho, alto)
    izquierda = (ancho - lado) // 2
    arriba = (alto - lado) // 2
    return imagen.crop((izquierda, arriba, izquierda + lado, arriba + lado))


def _preparar_para_formato(imagen, formato_pil):
    """JPEG no admite canal alfa: se aplana sobre fondo blanco si hace falta."""
    if formato_pil == 'JPEG' and imagen.mode in ('RGBA', 'LA', 'P'):
        rgba = imagen.convert('RGBA')
        fondo = Image.new('RGB', imagen.size, (255, 255, 255))
        fondo.paste(rgba, mask=rgba.split()[-1])
        return fondo
    return imagen


def normalizar_campo_imagen(field_file, tamano_exacto=None, tamano_maximo=None):
    """
    Redimensiona in-place la imagen de un `FileField`/`ImageField` si hace falta.

    - `tamano_exacto=(w, h)`: recorta al cuadrado central y fuerza esa medida
      exacta (insignias).
    - `tamano_maximo=(w, h)`: reduce si excede esa medida preservando la
      proporción, y nunca amplía una imagen ya más pequeña (avatares y foto
      de perfil).

    Se debe pasar exactamente uno de los dos parámetros.

    Devuelve `True` si reescribió el archivo y `False` si no hizo falta (ya
    cumplía la regla) o si no se pudo procesar (archivo ausente, corrupto o
    no reconocible como imagen): en ese caso se registra un aviso y se deja
    pasar el guardado original sin romperlo, porque este helper no es quien
    decide si el archivo es válido (de eso se encarga el validador del
    campo, que corre antes).
    """
    if not field_file:
        return False

    nombre = field_file.name or ''
    # Hay que distinguirlo ANTES de tocar nada: un archivo recién subido
    # (`_committed=False`) todavía no tiene ninguna copia en el storage, así
    # que su único contenido es el que estamos a punto de leer. Uno ya
    # guardado (`_committed=True`, un registro existente o uno restaurado por
    # `loaddata`) sí puede reabrirse desde el storage cuantas veces haga
    # falta.
    ya_comprometido = getattr(field_file, '_committed', True)

    try:
        field_file.seek(0)
        datos_originales = field_file.read()
    except (FileNotFoundError, OSError, ValueError) as exc:
        logger.warning('No se pudo leer la imagen "%s" para normalizarla: %s', nombre, exc)
        return False
    finally:
        if ya_comprometido:
            # `close()` deja el descriptor cerrado pero `FieldFile` sigue
            # cacheando esa misma instancia en `_file`: si no se limpia, la
            # siguiente vez que algo acceda al archivo (por ejemplo, el mismo
            # `Profile` guardándose dos veces seguidas, como ocurre con la
            # señal `save_user_profile`) reutilizaría el descriptor ya
            # cerrado en vez de reabrirlo desde el storage.
            try:
                field_file.close()
            except Exception:  # pragma: no cover - cierre best-effort
                pass
            if getattr(field_file, '_file', None) is not None:
                field_file._file = None
        else:
            # Archivo recién subido: si al final no hace falta reescribirlo
            # (ya mide lo que debe), Django todavía necesita leerlo entero
            # para comprometerlo al storage por primera vez. No hay de dónde
            # reabrirlo -solo existe en memoria-, así que aquí basta con
            # devolver el cursor al principio, nunca cerrarlo ni soltarlo.
            try:
                field_file.seek(0)
            except Exception:  # pragma: no cover - best-effort
                pass

    try:
        with Image.open(BytesIO(datos_originales)) as imagen:
            imagen.load()
            formato_original = imagen.format
            ancho, alto = imagen.size

            if tamano_exacto is not None:
                if (ancho, alto) == tuple(tamano_exacto):
                    return False
                procesada = _recortar_a_cuadrado(imagen).resize(tamano_exacto, Image.LANCZOS)
            elif tamano_maximo is not None:
                max_ancho, max_alto = tamano_maximo
                if ancho <= max_ancho and alto <= max_alto:
                    return False
                procesada = imagen.copy()
                procesada.thumbnail(tamano_maximo, Image.LANCZOS)
            else:
                raise ValueError('Hay que indicar tamano_exacto o tamano_maximo')

            formato_pil = _formato_pil(nombre, formato_original)
            procesada = _preparar_para_formato(procesada, formato_pil)

            buffer = BytesIO()
            kwargs_guardado = {'quality': 90} if formato_pil in ('JPEG', 'WEBP') else {}
            procesada.save(buffer, format=formato_pil, **kwargs_guardado)
    except (UnidentifiedImageError, OSError) as exc:
        logger.warning('No se pudo normalizar la imagen "%s": %s', nombre, exc)
        return False

    _reescribir_archivo(field_file, buffer.getvalue())
    return True


def _reescribir_archivo(field_file, contenido):
    """
    Sustituye el contenido de `field_file` por `contenido`, conservando el
    nombre/ruta.

    Si el archivo ya estaba guardado en el storage (`_committed=True`: un
    registro existente, o uno recién restaurado por `loaddata`) se borra y se
    vuelve a guardar con el mismo nombre; si no se borrara antes, el storage
    generaría un nombre alternativo (`foo_a1b2c3.png`) para no pisar el
    archivo sin normalizar, dejándolo huérfano en disco.

    Si todavía no se había guardado (un `ImageField` recién asignado desde un
    formulario o la API) basta con reemplazar su contenido en memoria: el
    nombre definitivo lo decide `upload_to` como de costumbre cuando el
    modelo llegue a guardarse.
    """
    if getattr(field_file, '_committed', True):
        nombre = field_file.name
        if field_file.storage.exists(nombre):
            field_file.storage.delete(nombre)
        field_file.name = field_file.storage.save(nombre, ContentFile(contenido))
    else:
        field_file.file = ContentFile(contenido)
