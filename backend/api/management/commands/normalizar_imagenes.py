"""
Comando de gestión: aplica a las imágenes YA GUARDADAS las mismas reglas de
tamaño que `api.image_processing` aplica en cada guardado nuevo (señal
`pre_save` en `api/models.py`).

Hace falta un comando aparte porque esa señal solo actúa hacia delante: los
datos que ya estaban mal dimensionados antes de este cambio (insignias de
1024x1024 o 256x256, avatares de 640x640 y 736x736) siguen así hasta que algo
los reprocese explícitamente.
"""
from django.core.management.base import BaseCommand
from django.template.defaultfilters import filesizeformat
from PIL import Image, UnidentifiedImageError

from api.image_processing import AVATAR_MAX_SIZE, BADGE_SIZE, normalizar_campo_imagen
from api.models import Avatar, Badge, Profile


def _limpiar_descriptor_cacheado(field_file):
    # Mismo motivo que en `image_processing._reescribir_archivo`: `FieldFile`
    # cachea el archivo abierto en `_file` y no lo limpia solo, así que sin
    # esto una segunda lectura del mismo objeto (dos tareas de este comando
    # sobre el mismo campo) se toparía con un descriptor ya cerrado.
    archivo = getattr(field_file, '_file', None)
    if archivo is not None:
        try:
            archivo.close()
        except Exception:  # pragma: no cover - cierre best-effort
            pass
        field_file._file = None


def _dimensiones_actuales(field_file):
    """Lee solo las dimensiones (sin decodificar toda la imagen) para el --dry-run."""
    try:
        with field_file.open('rb') as fh:
            with Image.open(fh) as imagen:
                return imagen.size
    except (FileNotFoundError, OSError, UnidentifiedImageError):
        return None
    finally:
        _limpiar_descriptor_cacheado(field_file)


def _tamano_resultante(ancho, alto, tamano_exacto=None, tamano_maximo=None):
    """Réplica aritmética de la decisión que toma `normalizar_campo_imagen`, solo para informar."""
    if tamano_exacto is not None:
        return tamano_exacto
    max_ancho, max_alto = tamano_maximo
    if ancho <= max_ancho and alto <= max_alto:
        return (ancho, alto)
    escala = min(max_ancho / ancho, max_alto / alto)
    return (max(1, round(ancho * escala)), max(1, round(alto * escala)))


class Command(BaseCommand):
    help = (
        'Normaliza el tamaño de las imágenes ya guardadas de insignias, avatares y '
        'fotos de perfil (80x80 exactos para insignias; máximo 256x256 sin ampliar '
        'para avatares y foto de perfil). Es idempotente: correrlo dos veces seguidas '
        'no vuelve a comprimir ni a degradar nada, porque solo reescribe lo que todavía '
        'no cumple la regla.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='No modifica ningún archivo: solo informa de qué se cambiaría y cuánto pesa hoy.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        tareas = (
            ('Insignia', Badge.objects.all(), {'tamano_exacto': BADGE_SIZE}),
            ('Avatar', Avatar.objects.all(), {'tamano_maximo': AVATAR_MAX_SIZE}),
            ('Foto de perfil', Profile.objects.exclude(image=''), {'tamano_maximo': AVATAR_MAX_SIZE}),
        )

        total_revisadas = 0
        total_cambiadas = 0
        total_ahorrado_bytes = 0

        for etiqueta, queryset, reglas in tareas:
            for obj in queryset:
                if not obj.image:
                    continue

                nombre = obj.image.name
                try:
                    peso_antes = obj.image.size
                except (FileNotFoundError, OSError):
                    self.stderr.write(self.style.WARNING(
                        f'{etiqueta} "{nombre}": el archivo no existe en el storage, se omite.'
                    ))
                    continue

                total_revisadas += 1

                if dry_run:
                    dimensiones = _dimensiones_actuales(obj.image)
                    if dimensiones is None:
                        self.stderr.write(self.style.WARNING(
                            f'{etiqueta} "{nombre}": no se pudo leer como imagen, se omite.'
                        ))
                        continue
                    ancho, alto = dimensiones
                    ancho_final, alto_final = _tamano_resultante(ancho, alto, **reglas)
                    if (ancho, alto) == (ancho_final, alto_final):
                        continue
                    total_cambiadas += 1
                    self.stdout.write(
                        f'[DRY-RUN] {etiqueta} "{nombre}": {ancho}x{alto} ({filesizeformat(peso_antes)}) '
                        f'-> se reduciría a {ancho_final}x{alto_final}'
                    )
                    continue

                cambiado = normalizar_campo_imagen(obj.image, **reglas)
                if not cambiado:
                    continue

                # `normalizar_campo_imagen` ya reescribió el archivo en el storage
                # con el mismo nombre (ver `_reescribir_archivo`): estos objetos
                # vienen de una consulta a la base de datos, así que su imagen ya
                # estaba "committed" y no hace falta volver a llamar a `obj.save()`
                # -ni tocar la fila en la base de datos, porque el nombre no cambia.
                peso_despues = obj.image.size
                ahorro = max(peso_antes - peso_despues, 0)
                total_ahorrado_bytes += ahorro
                total_cambiadas += 1
                self.stdout.write(self.style.SUCCESS(
                    f'{etiqueta} "{nombre}": {filesizeformat(peso_antes)} -> {filesizeformat(peso_despues)} '
                    f'(ahorro: {filesizeformat(ahorro)})'
                ))

        self.stdout.write('')
        if dry_run:
            self.stdout.write(
                f'[DRY-RUN] {total_cambiadas} de {total_revisadas} imagen(es) se normalizarían. '
                'Ejecuta sin --dry-run para aplicarlo.'
            )
        else:
            self.stdout.write(self.style.SUCCESS(
                f'{total_cambiadas} de {total_revisadas} imagen(es) normalizadas. '
                f'Ahorro total: {filesizeformat(total_ahorrado_bytes)}.'
            ))
