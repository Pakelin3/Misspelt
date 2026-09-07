/**
 * Corrige el origen de las URLs de imagen que devuelve el backend.
 *
 * El problema real que resuelve
 * -----------------------------
 * Los serializers construyen las URLs de avatares e insignias con
 * `request.build_absolute_uri()`, que deriva el esquema y el host de la
 * peticion **tal como la ve Django**. Django corre en plano detras de un
 * terminador TLS, asi que ve `http` y entrega:
 *
 *     http://127.0.0.1:8000/media/badges/x.png
 *
 * Pero en ese puerto solo se escucha TLS, y la pagina que consume esas URLs se
 * sirve por `https`. El navegador ni llega a intentarlo: es contenido mixto.
 * Resultado observado: no cargaba ni una sola imagen en toda la aplicacion.
 *
 * En el backend eso se arregla con `SECURE_PROXY_SSL_HEADER`, y esta puesto.
 * Pero solo funciona si el proxy que hay delante manda `X-Forwarded-Proto`, y
 * un terminador que solo reenvia bytes TCP no puede hacerlo. Es decir: el
 * frontend no puede dar por supuesto que el backend acertara con su propio
 * esquema.
 *
 * Y no hace falta que lo suponga, porque ya lo sabe: `VITE_BACKEND_URL_API` es
 * la direccion por la que habla con el backend, y funciona. Si una URL de
 * imagen apunta a ese mismo host, su origen correcto es ese y no otro.
 *
 * Por que se compara el host
 * --------------------------
 * Solo se corrige cuando el host coincide, o sea cuando es el mismo servidor
 * al que ya se le hacen las peticiones. Una URL de imagen servida desde otro
 * host —un CDN, un bucket— se deja intacta: ahi el backend no esta adivinando
 * nada, esta diciendo donde vive de verdad el archivo, y reescribirlo lo
 * romperia.
 *
 * Cuando el backend esta bien configurado esta funcion no cambia nada. Existe
 * para que una configuracion de proxy no pueda volver a dejar la aplicacion sin
 * imagenes.
 */

const origenApi = (() => {
    try {
        return new URL(import.meta.env.VITE_BACKEND_URL_API).origin;
    } catch {
        // Sin base configurada no hay nada con lo que comparar: se devuelve
        // todo tal cual en lugar de inventar un origen.
        return null;
    }
})();

export const normalizarUrlDeMedia = (url) => {
    if (typeof url !== 'string' || !url || !origenApi) return url;

    // Una ruta relativa se resuelve contra el backend, no contra el host del
    // frontend, que no sirve `/media/`.
    if (url.startsWith('/') && !url.startsWith('//')) return origenApi + url;

    let destino;
    let api;
    try {
        destino = new URL(url);
        api = new URL(origenApi);
    } catch {
        // Un `data:` URI, un blob o cualquier cosa que no sea una URL absoluta
        // parseable se devuelve sin tocar.
        return url;
    }

    if (destino.hostname !== api.hostname) return url;

    destino.protocol = api.protocol;
    destino.port = api.port;
    return destino.toString();
};

export default normalizarUrlDeMedia;
