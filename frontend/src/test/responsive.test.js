import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Guardia de responsividad.
 *
 * Se añadio despues de comprobar en un movil emulado de 360px que el titulo del
 * hero medía 512px y se salía de pantalla: `TextShuffle` tenia `text-[4rem]`
 * hardcodeado, 64px por caracter en cualquier viewport. Estos tests buscan la
 * clase de error que produce ese sintoma.
 */

const SRC = join(process.cwd(), 'src');
const MOVIL_MAS_ESTRECHO = 360; // Android pequeño, el suelo que soportamos

const walk = (dir) => {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else out.push(full);
    }
    return out;
};

const jsxFiles = walk(SRC).filter((f) => f.endsWith('.jsx') && !f.includes('.test.'));

const scanLines = (regex) => {
    const hits = [];
    for (const file of jsxFiles) {
        readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            const t = line.trim();
            if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
            for (const m of line.matchAll(regex)) {
                hits.push({ file: relative(process.cwd(), file), line: i + 1, match: m });
            }
        });
    }
    return hits;
};

const fmt = (hits) => hits.map((h) => `  ${h.file}:${h.line}  ${h.match[0]}`).join('\n');

describe('responsividad', () => {
    it('ningun ancho fijo supera el viewport movil mas estrecho', () => {
        const malos = scanLines(/\b(?:w|min-w)-\[(\d+)px\]/g)
            .filter((h) => Number(h.match[1]) > MOVIL_MAS_ESTRECHO - 32); // 32 = padding lateral
        expect(malos, `Rompen en ${MOVIL_MAS_ESTRECHO}px. Usa w-full con max-w-*:\n${fmt(malos)}`).toEqual([]);
    });

    it('no hay alturas fijas grandes: el contenido debe mandar', () => {
        const malos = scanLines(/\bh-\[(\d+)px\]/g).filter((h) => Number(h.match[1]) > 600);
        expect(malos, `Una altura fija asi se rompe con cualquier cambio de contenido:\n${fmt(malos)}`).toEqual([]);
    });

    it('los tamanos de fuente fijos grandes escalan con el viewport', () => {
        // 8 caracteres de Press Start 2P a 4rem son 512px: no caben en un movil.
        const malos = scanLines(/\btext-\[(\d+(?:\.\d+)?)rem\]/g)
            .filter((h) => Number(h.match[1]) >= 2.5);
        expect(malos, `Usa clamp() o variantes por breakpoint:\n${fmt(malos)}`).toEqual([]);
    });

    it('las tablas van dentro de un contenedor con scroll horizontal', () => {
        const malos = [];
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            if (text.includes('<table') && !text.includes('overflow-x-auto')) {
                malos.push({ file: relative(process.cwd(), file), line: 0, match: ['<table sin overflow-x-auto'] });
            }
        }
        expect(malos, `Una tabla sin scroll propio desborda la pagina:\n${fmt(malos)}`).toEqual([]);
    });

    it('no se bloquea el zoom en ningun documento HTML', () => {
        // `public/game/index.html` lo genera Godot al exportar. Una vez se
        // arreglo editandolo a mano y la siguiente exportacion lo revirtio sin
        // avisar; ahora el arreglo vive en la plantilla del proyecto de Godot
        // (`web/shell.html` + `html/custom_html_shell`), y esta guardia es la
        // que detecta si una exportacion futura vuelve a romperlo.
        const htmls = ['index.html', 'public/game/index.html'];
        const malos = [];
        for (const h of htmls) {
            let text;
            try { text = readFileSync(join(process.cwd(), h), 'utf8'); } catch { continue; }
            // Se quitan los comentarios antes de buscar: solo cuenta lo que el
            // navegador obedece. La plantilla explica en un comentario por que
            // no lleva `user-scalable=no`, y mencionarlo no es incumplirlo.
            const efectivo = text.replace(/<!--[\s\S]*?-->/g, '');
            if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(efectivo)) malos.push(h);
        }
        expect(malos, `Bloquear el zoom incumple WCAG 1.4.4: ${malos.join(', ')}`).toEqual([]);
    });

    it('los formularios de acceso declaran autoComplete e inputMode', () => {
        const faltan = [];
        for (const f of ['src/views/LoginPage.jsx', 'src/views/RegisterPage.jsx']) {
            const text = readFileSync(join(process.cwd(), f), 'utf8');
            const inputs = text.match(/<input\b[^>]*>/gs) ?? [];
            for (const tag of inputs) {
                if (/type="(hidden|checkbox|radio)"/.test(tag)) continue;
                if (!tag.includes('autoComplete')) {
                    faltan.push({ file: f, line: 0, match: [`input sin autoComplete: ${tag.slice(0, 60)}`] });
                }
            }
        }
        expect(faltan, `Sin esto el autofill y el teclado movil no funcionan:\n${fmt(faltan)}`).toEqual([]);
    });
});
