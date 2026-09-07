import { describe, it, expect } from 'vitest';
import { normalizarUrlDeMedia } from '@/utils/mediaUrl';

/**
 * `VITE_BACKEND_URL_API` vale `https://127.0.0.1:8000/api` en este entorno,
 * asi que el origen correcto para las imagenes del backend es
 * `https://127.0.0.1:8000`.
 *
 * El defecto que fija esta guardia se observo en la aplicacion en marcha: la
 * API devolvia las URLs de insignias y avatares en `http://127.0.0.1:8000/...`
 * porque Django, que corre en plano detras de un terminador TLS, deriva el
 * esquema de la peticion que el ve. En ese puerto solo se escucha TLS y la
 * pagina va por https, asi que el navegador no cargaba ni una imagen.
 */
describe('normalizarUrlDeMedia', () => {
    it('corrige el esquema de una URL del propio backend', () => {
        expect(normalizarUrlDeMedia('http://127.0.0.1:8000/media/badges/x.png'))
            .toBe('https://127.0.0.1:8000/media/badges/x.png');
    });

    it('deja intacta la que ya viene bien', () => {
        const buena = 'https://127.0.0.1:8000/media/avatars/y.jpg';
        expect(normalizarUrlDeMedia(buena)).toBe(buena);
    });

    it('corrige tambien el puerto si el backend lo adivina mal', () => {
        // Detras de un proxy, Django puede ver el puerto interno (8001) en vez
        // del publico. El origen que vale es el que el frontend usa de verdad.
        expect(normalizarUrlDeMedia('http://127.0.0.1:8001/media/badges/x.png'))
            .toBe('https://127.0.0.1:8000/media/badges/x.png');
    });

    it('resuelve una ruta relativa contra el backend, no contra el frontend', () => {
        // El host del frontend no sirve /media/.
        expect(normalizarUrlDeMedia('/media/badges/x.png'))
            .toBe('https://127.0.0.1:8000/media/badges/x.png');
    });

    it('no toca una imagen servida desde otro host', () => {
        // Aqui el backend no esta adivinando: esta diciendo donde vive el
        // archivo. Reescribirlo lo romperia.
        const externa = 'https://ui-avatars.com/api/?name=Ana&background=random';
        expect(normalizarUrlDeMedia(externa)).toBe(externa);
        const cdn = 'https://cdn.ejemplo.com/media/badges/x.png';
        expect(normalizarUrlDeMedia(cdn)).toBe(cdn);
    });

    it('no toca blobs ni data URIs', () => {
        // `ImageUploadField` pinta la vista previa con un object URL: si esta
        // funcion lo reescribiera, la vista previa de subida dejaria de verse.
        const blob = 'blob:https://localhost:5174/9f1c-4a2b';
        expect(normalizarUrlDeMedia(blob)).toBe(blob);
        const data = 'data:image/png;base64,iVBORw0KGgo=';
        expect(normalizarUrlDeMedia(data)).toBe(data);
    });

    it('devuelve tal cual lo que no es una cadena util', () => {
        expect(normalizarUrlDeMedia(null)).toBe(null);
        expect(normalizarUrlDeMedia(undefined)).toBe(undefined);
        expect(normalizarUrlDeMedia('')).toBe('');
    });
});
