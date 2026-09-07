"""Termina TLS delante del `runserver` de Django, para desarrollo.

Por que existe
--------------
El frontend de desarrollo se sirve por `https://localhost:5174`. Desde una
pagina https el navegador bloquea como contenido mixto cualquier peticion o
imagen que salga por `http://`, asi que el backend tambien tiene que hablar
TLS. `manage.py runserver` no sabe hacerlo, de modo que Django corre en plano
y este proceso pone el TLS delante:

    navegador  --https-->  este proxy (8000)  --http-->  runserver (8001)

Y sobre todo: **anade `X-Forwarded-Proto: https`**. Sin esa cabecera Django
no tiene forma de saber que la peticion original venia cifrada, asi que
`request.is_secure()` da False y `request.build_absolute_uri()` devuelve URLs
`http://...` para los avatares y las insignias. Esas URLs apuntan a un
esquema en el que nadie escucha, y aunque escuchase el navegador las
bloquearia. El resultado, ya observado, es que no carga ni una imagen.

Un reenviador de bytes TCP no sirve para esto: no entiende HTTP, asi que no
puede insertar la cabecera. De ahi que este proxy parsee la peticion.

Django solo hace caso a esa cabecera si `SECURE_PROXY_SSL_HEADER` esta
configurado en `settings.py`. Ambas piezas van juntas.

Uso
---
    python tools/tls_dev_proxy.py                  # 8000 -> 8001
    python tools/tls_dev_proxy.py --puerto 8000 --destino 8001

Con Django escuchando aparte:

    python manage.py runserver 127.0.0.1:8001

Solo para desarrollo local: escucha en la interfaz de loopback y usa el
certificado autofirmado del repo. En produccion esto lo hace nginx, Caddy o
el balanceador del proveedor.
"""
import argparse
import asyncio
import pathlib
import ssl

BASE = pathlib.Path(__file__).resolve().parent.parent

# Cabeceras que decide el proxy y que por tanto no puede aceptar del cliente.
# Si un cliente pudiera mandar su propio `X-Forwarded-Proto: https`, cualquiera
# podria convencer a Django de que su peticion en claro venia cifrada. Se
# descartan las entrantes y se escribe la nuestra.
CABECERAS_PROPIAS = (b'x-forwarded-proto', b'x-forwarded-port')


async def leer_cabecera(lector):
    """Devuelve la peticion hasta la linea en blanco, o None si se cerro."""
    try:
        cabecera = await lector.readuntil(b'\r\n\r\n')
    except (asyncio.IncompleteReadError, asyncio.LimitOverrunError, ConnectionError):
        return None
    return cabecera or None


def reescribir(cabecera, puerto):
    """Quita las cabeceras que nos corresponden y anade las nuestras."""
    lineas = cabecera.split(b'\r\n')
    peticion, resto = lineas[0], lineas[1:]
    conservadas = [
        linea for linea in resto
        if linea and not linea.split(b':', 1)[0].strip().lower() in CABECERAS_PROPIAS
    ]
    conservadas.append(b'X-Forwarded-Proto: https')
    conservadas.append(b'X-Forwarded-Port: %d' % puerto)
    return peticion + b'\r\n' + b'\r\n'.join(conservadas) + b'\r\n\r\n'


def longitud_cuerpo(cabecera):
    """(bytes_declarados, es_troceado) segun las cabeceras de la peticion."""
    troceado = False
    longitud = 0
    for linea in cabecera.split(b'\r\n')[1:]:
        if b':' not in linea:
            continue
        nombre, valor = linea.split(b':', 1)
        nombre = nombre.strip().lower()
        if nombre == b'content-length':
            try:
                longitud = int(valor.strip())
            except ValueError:
                longitud = 0
        elif nombre == b'transfer-encoding' and b'chunked' in valor.lower():
            troceado = True
    return longitud, troceado


async def copiar_exacto(lector, escritor, cantidad):
    """Reenvia `cantidad` bytes sin cargarlos enteros en memoria."""
    restante = cantidad
    while restante > 0:
        trozo = await lector.read(min(65536, restante))
        if not trozo:
            return False
        escritor.write(trozo)
        await escritor.drain()
        restante -= len(trozo)
    return True


async def copiar_troceado(lector, escritor):
    """Reenvia un cuerpo `Transfer-Encoding: chunked` trozo a trozo."""
    while True:
        linea = await lector.readline()
        if not linea:
            return False
        escritor.write(linea)
        tamano = linea.split(b';', 1)[0].strip()
        try:
            n = int(tamano, 16)
        except ValueError:
            await escritor.drain()
            return False
        if n == 0:
            # Tras el trozo cero vienen los remolques y la linea en blanco.
            while True:
                fin = await lector.readline()
                if not fin:
                    return False
                escritor.write(fin)
                if fin in (b'\r\n', b'\n'):
                    break
            await escritor.drain()
            return True
        if not await copiar_exacto(lector, escritor, n + 2):  # +2 por el CRLF
            return False


async def bombear_respuesta(lector, escritor):
    """La respuesta no se toca: se reenvia tal cual."""
    try:
        while True:
            dato = await lector.read(65536)
            if not dato:
                break
            escritor.write(dato)
            await escritor.drain()
    except (ConnectionError, asyncio.CancelledError):
        pass


async def bombear_peticiones(cliente_lector, servidor_escritor, puerto):
    """Reenvia peticiones anadiendo la cabecera de esquema a cada una.

    Se procesa peticion a peticion, y no como un flujo de bytes, porque con
    `keep-alive` el navegador manda varias por la misma conexion y todas
    necesitan la cabecera, no solo la primera.
    """
    while True:
        cabecera = await leer_cabecera(cliente_lector)
        if cabecera is None:
            break
        servidor_escritor.write(reescribir(cabecera, puerto))
        await servidor_escritor.drain()

        longitud, troceado = longitud_cuerpo(cabecera)
        if troceado:
            if not await copiar_troceado(cliente_lector, servidor_escritor):
                break
        elif longitud and not await copiar_exacto(cliente_lector, servidor_escritor, longitud):
            break


def crear_manejador(destino, puerto):
    async def manejar(cliente_lector, cliente_escritor):
        try:
            servidor_lector, servidor_escritor = await asyncio.open_connection('127.0.0.1', destino)
        except OSError:
            # Django no esta levantado: se corta limpiamente en lugar de dejar
            # al navegador esperando.
            cliente_escritor.close()
            return
        try:
            await asyncio.gather(
                bombear_peticiones(cliente_lector, servidor_escritor, puerto),
                bombear_respuesta(servidor_lector, cliente_escritor),
                return_exceptions=True,
            )
        finally:
            for escritor in (servidor_escritor, cliente_escritor):
                try:
                    escritor.close()
                except OSError:
                    pass
    return manejar


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--puerto', type=int, default=8000, help='puerto TLS de escucha')
    parser.add_argument('--destino', type=int, default=8001, help='puerto plano de runserver')
    parser.add_argument('--cert', default=str(BASE / 'cert.pem'))
    parser.add_argument('--clave', default=str(BASE / 'key.pem'))
    args = parser.parse_args()

    contexto = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    contexto.load_cert_chain(args.cert, args.clave)

    servidor = await asyncio.start_server(
        crear_manejador(args.destino, args.puerto), '127.0.0.1', args.puerto, ssl=contexto,
    )
    print(f'TLS en https://127.0.0.1:{args.puerto} -> http://127.0.0.1:{args.destino} '
          f'(con X-Forwarded-Proto: https)', flush=True)
    async with servidor:
        await servidor.serve_forever()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
