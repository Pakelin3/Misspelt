import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * El `<head>` acumulaba tres problemas que no se ven revisando componentes:
 * un script de terceros sin usar y bloqueante (`js.puter.com`), la fuente
 * Press Start 2P pedida dos veces (por `<link>` y por un `@import` en el CSS),
 * y ningun script anti-parpadeo de tema.
 */
const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

describe('index.html', () => {
    it('no carga scripts de terceros', () => {
        const externos = [...html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
        expect(externos, `Scripts externos en el head: ${externos.join(', ')}`).toEqual([]);
    });

    it('declara el idioma del documento', () => {
        expect(html).toMatch(/<html[^>]+lang="es"/);
    });

    it('permite el zoom', () => {
        const viewport = html.match(/<meta name="viewport" content="([^"]*)"/)?.[1] ?? '';
        expect(viewport).toContain('width=device-width');
        expect(viewport).not.toMatch(/user-scalable\s*=\s*no/);
        expect(viewport).not.toMatch(/maximum-scale/);
    });

    it('aplica el tema antes del primer pintado', () => {
        // Si esto se hiciera solo en un useEffect, cada carga mostraria un
        // fogonazo del tema claro antes de pasar a oscuro.
        expect(html).toMatch(/localStorage\.getItem\(['"]theme['"]\)/);
        expect(html).toContain('prefers-color-scheme');
    });

    it('tiene una descripcion para buscadores y previsualizaciones', () => {
        expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/);
    });
});

describe('carga de fuentes', () => {
    it('las fuentes se piden una sola vez, y no desde el CSS', () => {
        // Un @import de Google Fonts dentro del CSS bloquea el render de la hoja
        // y duplica la peticion que ya hace el <link> del HTML.
        expect(css).not.toMatch(/@import\s+url\(["']?https:\/\/fonts\.googleapis/);
    });

    it('el <link> de fuentes cubre las dos familias del sistema', () => {
        // Solo las hojas de estilo, no el preconnect al mismo dominio.
        const enlaces = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>|<link[^>]*>/g)]
            .filter((m) => m[0].includes('fonts.googleapis') && m[0].includes('css2'))
            .map((m) => m[0].match(/href="([^"]+)"/)[1]);
        expect(enlaces).toHaveLength(1);
        expect(enlaces[0]).toContain('Press+Start+2P');
        expect(enlaces[0]).toContain('VT323');
        // Sin display=swap el texto quedaria invisible mientras carga la fuente.
        expect(enlaces[0]).toContain('display=swap');
    });

    it('precarga la conexion a los dominios de fuentes', () => {
        expect(html).toMatch(/rel="preconnect"[^>]+fonts\.googleapis/);
        expect(html).toMatch(/rel="preconnect"[^>]+fonts\.gstatic/);
    });
});
