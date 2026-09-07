"""
Validadores de subida de imágenes.

`ImageField` de Django ya rechaza lo que no es una imagen decodificable, pero
no pone ningún límite de peso: sin uno, un archivo de 60 MB (o algo disfrazado
de imagen) llega intacto hasta Pillow, que tiene que descomprimirlo entero en
memoria solo para poder rechazarlo después. Este validador corta eso antes:
comprueba `archivo.size` (un atributo, no requiere abrir ni decodificar nada)
y solo entonces deja pasar el archivo hacia el resto del pipeline (incluida la
normalización de `api.image_processing`).
"""
from django.core.exceptions import ValidationError
from django.template.defaultfilters import filesizeformat

# 10 MB: generoso para cualquier insignia o avatar legítimo (las imágenes
# reales más pesadas medidas en este proyecto rondan 1.5 MB) y muy por debajo
# de lo que supondría un problema real de memoria/disco.
MAX_IMAGEN_BYTES = 10 * 1024 * 1024


def validar_tamano_imagen(archivo):
    """Rechaza archivos que superan `MAX_IMAGEN_BYTES` con un mensaje en español."""
    if archivo.size > MAX_IMAGEN_BYTES:
        raise ValidationError(
            'El archivo pesa %(actual)s y el máximo permitido es %(limite)s. '
            'Comprime la imagen (por ejemplo en squoosh.app) y vuelve a subirla.',
            code='imagen_demasiado_pesada',
            params={
                'actual': filesizeformat(archivo.size),
                'limite': filesizeformat(MAX_IMAGEN_BYTES),
            },
        )
