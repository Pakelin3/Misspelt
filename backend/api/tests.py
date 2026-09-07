"""
Tests del enrutado y de los proxies de servicios externos.

Nacen de dos fallos reales encontrados en produccion local:

1. El servido de MEDIA estaba declarado dentro de `api/urls.py`, que va montado
   bajo el prefijo `api/`. La ruta real quedaba en `/api/media/...` mientras los
   serializers construyen `/media/...` con `request.build_absolute_uri()`, asi que
   NINGUNA imagen de avatar ni de insignia cargaba en la aplicacion.
2. Las claves de ElevenLabs, Gemini y el PAT de GitHub vivian en el cliente con
   prefijo `VITE_`, que Vite inlinea en texto plano en el bundle publico. Ahora
   hay endpoints proxy y estos tests fijan su contrato de autenticacion.
"""
import importlib
import shutil
import tempfile
from io import BytesIO

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, TestCase, override_settings
from django.urls import Resolver404, clear_url_caches, resolve, reverse
from PIL import Image
from rest_framework.test import APITestCase  # pyright: ignore[reportMissingImports]

from api.models import Avatar, Badge, User
from api.serializer import myTokenObtainPairSerializer
from api.validators import MAX_IMAGEN_BYTES, validar_tamano_imagen


class RutasDeMediaTests(TestCase):
    """
    `django.conf.urls.static.static()` solo declara la ruta cuando DEBUG es True, y
    el runner de tests fuerza DEBUG=False. Por eso hay que reactivarlo y recargar
    el URLconf: si no, este test pasaria siempre por el motivo equivocado.
    En produccion las imagenes las sirve el servidor web, no Django.
    """

    @override_settings(DEBUG=True)
    def test_media_resuelve_en_la_raiz_no_bajo_api(self):
        clear_url_caches()
        importlib.reload(importlib.import_module(settings.ROOT_URLCONF))
        try:
            # Es la URL exacta que generan los serializers para avatares e insignias.
            coincidencia = resolve('/media/avatars/default.jpg')
        except Resolver404:
            self.fail(
                'La ruta /media/ no resuelve en la raiz: los avatares y las '
                'insignias devolverian 404 en toda la aplicacion.'
            )
        else:
            self.assertEqual(coincidencia.func.__name__, 'serve')
        finally:
            clear_url_caches()
            importlib.reload(importlib.import_module(settings.ROOT_URLCONF))

    @override_settings(DEBUG=True)
    def test_media_no_queda_bajo_el_prefijo_api(self):
        # El fallo original: estaba declarado en api/urls.py y la ruta real era
        # /api/media/..., que ningun serializer genera nunca.
        clear_url_caches()
        importlib.reload(importlib.import_module(settings.ROOT_URLCONF))
        try:
            with self.assertRaises(Resolver404):
                resolve('/api/media/avatars/default.jpg')
        finally:
            clear_url_caches()
            importlib.reload(importlib.import_module(settings.ROOT_URLCONF))

    def test_la_api_sigue_montada_bajo_su_prefijo(self):
        # Mover el servido de media no debe haber alterado el resto del enrutado.
        self.assertEqual(resolve('/api/words/').func.cls.__name__, 'WordViewSet')


class ProxiesDeServiciosExternosTests(APITestCase):
    """Los proxies existen para que ninguna clave de terceros llegue al navegador."""

    ENDPOINTS = ('text_to_speech', 'speech_to_text', 'suggest_word')

    def test_los_tres_proxies_estan_registrados(self):
        esperado = {
            'text_to_speech': '/api/game/tts/',
            'speech_to_text': '/api/game/stt/',
            'suggest_word': '/api/dictionary/suggest-word/',
        }
        for nombre, ruta in esperado.items():
            self.assertEqual(reverse(nombre), ruta)

    def test_exigen_autenticacion(self):
        # Sin esto, cualquier visitante anonimo podria agotar la cuota de pago.
        for nombre in self.ENDPOINTS:
            with self.subTest(endpoint=nombre):
                respuesta = self.client.post(reverse(nombre), {})
                self.assertIn(
                    respuesta.status_code, (401, 403),
                    f'{nombre} responde {respuesta.status_code} a un anonimo',
                )

    def test_validan_la_entrada_antes_de_llamar_al_tercero(self):
        usuario = User.objects.create_user(
            username='tester', email='tester@example.com', password='clave-de-prueba',
        )
        self.client.force_authenticate(user=usuario)

        # Cuerpo vacio: debe rechazarse en el propio proxy, sin salir a la red.
        for nombre in self.ENDPOINTS:
            with self.subTest(endpoint=nombre):
                respuesta = self.client.post(reverse(nombre), {})
                self.assertIn(
                    respuesta.status_code, (400, 503),
                    f'{nombre} responde {respuesta.status_code} a un cuerpo vacio',
                )


class EsquemaDeUrlsDeMediaTests(TestCase):
    """
    Django corre en plano detras de un terminador TLS: `request.is_secure()` es
    False salvo que se le indique explicitamente por que cabecera preguntar.
    `SECURE_PROXY_SSL_HEADER` (en settings.py) es esa indicacion. Sin ella,
    `request.build_absolute_uri()` -que usan los serializers para las URLs de
    avatares e insignias- siempre devuelve `http://`, aunque el sitio real se
    sirva por HTTPS: el navegador lo bloquea como contenido mixto y ninguna
    imagen carga. Este test fija esa invariante a traves de una ruta de codigo
    real (el serializer del token), no reimplementando `build_absolute_uri`.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.usuario = User.objects.create_user(
            username='con-avatar', email='con-avatar@example.com', password='clave-de-prueba',
        )

    def _url_de_imagen_de_perfil(self, **extra_headers):
        request = self.factory.get('/api/token/', **extra_headers)
        # get_token() lee la request desde el contexto del serializer, no
        # desde argumentos: se instancia sin datos solo para acceder al metodo.
        serializer = myTokenObtainPairSerializer(context={'request': request})
        token = serializer.get_token(self.usuario)
        return token['profile_image_url']

    def test_respeta_x_forwarded_proto_https(self):
        # El proxy TLS termina la conexion y reenvia en plano marcando esta
        # cabecera: con SECURE_PROXY_SSL_HEADER configurado, Django debe
        # construir la URL como https:// aunque la request interna sea HTTP.
        url = self._url_de_imagen_de_perfil(HTTP_X_FORWARDED_PROTO='https')
        self.assertTrue(
            url.startswith('https://'),
            f'Se esperaba una URL https:// detras del proxy TLS, se obtuvo: {url}',
        )

    def test_sin_la_cabecera_sigue_siendo_http(self):
        # En desarrollo plano (sin proxy delante) no existe esa cabecera, y
        # Django debe seguir generando http://: esto documenta que el fix no
        # fuerza https incondicionalmente, solo cuando el proxy lo confirma.
        url = self._url_de_imagen_de_perfil()
        self.assertTrue(
            url.startswith('http://'),
            f'Se esperaba una URL http:// sin el proxy delante, se obtuvo: {url}',
        )


def _crear_imagen_en_memoria(ancho, alto, color, modo='RGBA', formato='PNG', nombre='imagen.png'):
    """
    Genera una imagen en memoria con Pillow (nunca en disco ni en el repo) para
    usarla como si fuera un archivo subido por un formulario.
    """
    buffer = BytesIO()
    Image.new(modo, (ancho, alto), color).save(buffer, format=formato)
    buffer.seek(0)
    return SimpleUploadedFile(nombre, buffer.read(), content_type=f'image/{formato.lower()}')


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix='misspelt_test_media_'))
class NormalizacionDeImagenesTests(TestCase):
    """
    `api.image_processing` (enganchado via `pre_save` en `api/models.py`) es
    quien de verdad decide el tamaño final de una insignia o un avatar, no el
    cliente: el panel de admin ya permitia saltarse la comprobacion de 80x80
    subiendo directamente por la API o por el admin de Django. Estos tests
    guardan objetos de verdad (no llaman a `normalizar_campo_imagen` a mano)
    para probar la señal tal cual se dispara en produccion.

    Usan un `MEDIA_ROOT` temporal (no `backend/media/`) para no dejar
    archivos de prueba mezclados con los datos reales del proyecto.
    """

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def test_una_insignia_de_1024x1024_se_reescala_a_80x80(self):
        # Es justo el defecto medido en produccion: 3 de 10 insignias
        # guardadas no median 80x80 (una incluso era de 1024x1024, 1.5MB)
        # porque nada en el servidor lo impedia.
        archivo = _crear_imagen_en_memoria(1024, 1024, (10, 20, 30, 255), nombre='grande.png')
        insignia = Badge.objects.create(
            title='Insignia gigante',
            description='Descripción de prueba',
            condition_description='Condición de prueba',
            reward_description='Recompensa de prueba',
            image=archivo,
        )

        with Image.open(insignia.image.path) as resultado:
            self.assertEqual(resultado.size, (80, 80))

    def test_un_avatar_mas_pequeno_que_el_maximo_no_se_amplia(self):
        # "no amplíes las que ya sean más pequeñas": un avatar de 50x50 debe
        # seguir midiendo 50x50, no estirarse hasta 256x256.
        archivo = _crear_imagen_en_memoria(
            50, 50, (200, 100, 50), modo='RGB', formato='JPEG', nombre='chico.jpg',
        )
        avatar = Avatar.objects.create(name='Avatar pequeño', image=archivo)

        with Image.open(avatar.image.path) as resultado:
            self.assertEqual(resultado.size, (50, 50))

    def test_se_preserva_la_transparencia_al_normalizar_una_insignia(self):
        # Varias insignias reales son RGBA (fondo transparente). Si la
        # normalización aplanara el canal alfa (por ejemplo al reencodear con
        # un formato que no lo soporta) el icono aparecería con fondo blanco
        # u opaco en vez de transparente.
        archivo = _crear_imagen_en_memoria(1024, 1024, (10, 20, 30, 77), nombre='transparente.png')
        insignia = Badge.objects.create(
            title='Insignia transparente',
            description='Descripción de prueba',
            condition_description='Condición de prueba',
            reward_description='Recompensa de prueba',
            image=archivo,
        )

        with Image.open(insignia.image.path) as resultado:
            self.assertEqual(resultado.mode, 'RGBA')
            self.assertEqual(resultado.getpixel((40, 40))[3], 77)


class ValidadorTamanoImagenTests(TestCase):
    """
    Pillow tiene que decodificar la imagen entera en memoria para poder
    normalizarla; sin un tope de peso previo, un archivo de decenas de MB
    llegaría intacto hasta ahí. `validar_tamano_imagen` corta eso mirando
    solo `archivo.size`, sin abrir el archivo.
    """

    def test_rechaza_un_archivo_que_supera_el_limite_con_mensaje_en_espanol(self):
        archivo = SimpleUploadedFile(
            'demasiado_grande.png', b'0' * (MAX_IMAGEN_BYTES + 1), content_type='image/png',
        )

        with self.assertRaises(ValidationError) as contexto:
            validar_tamano_imagen(archivo)

        mensaje = str(contexto.exception.messages[0])
        self.assertIn('pesa', mensaje)
        self.assertIn('máximo permitido', mensaje)
        self.assertEqual(contexto.exception.code, 'imagen_demasiado_pesada')

    def test_no_rechaza_un_archivo_dentro_del_limite(self):
        archivo = SimpleUploadedFile(
            'normal.png', b'0' * (MAX_IMAGEN_BYTES - 1), content_type='image/png',
        )
        try:
            validar_tamano_imagen(archivo)
        except ValidationError:
            self.fail('No debería rechazar un archivo por debajo del límite.')
