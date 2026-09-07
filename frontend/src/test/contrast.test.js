import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Contraste calculado, no revisado a ojo.
 *
 * Origen: un usuario reporto iconos que no se distinguian. La causa de fondo no
 * estaba en los componentes sino en la propia paleta: el dorado y el ambar
 * brillantes daban 1.75–1.94:1 sobre el pergamino claro (practicamente
 * invisibles) mientras en el tema oscuro iban sobradisimos a 8.70:1. Un cambio
 * de luminosidad en un primitivo puede volver a romperlo sin que nadie lo note,
 * asi que aqui se mide.
 *
 * Umbrales WCAG 2.2:
 *  - 1.4.11 Non-text Contrast: 3:1 para iconos, bordes y limites de controles.
 *  - 1.4.3 Contrast (Minimum): 4.5:1 para texto normal.
 * Se exige 3:1 porque estos tokens se usan sobre todo en iconos y etiquetas
 * cortas en font-mono grande; el texto largo va en `foreground`/`muted-foreground`,
 * que se comprueban aparte con el umbral de 4.5:1.
 */

const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

const bloques = () => {
    const iPrim = css.indexOf('--pixel-parchment-50');
    const iSem = css.indexOf('--background:');
    const iDark = css.indexOf('.dark {');
    const iFin = css.indexOf('html {', iDark);
    return {
        primitivos: css.slice(iPrim, iSem),
        claro: css.slice(iSem, iDark),
        oscuro: css.slice(iDark, iFin),
    };
};

const { primitivos, claro, oscuro } = bloques();

const mapaPrimitivos = Object.fromEntries(
    [...primitivos.matchAll(/(--pixel-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);

/** Resuelve un token semantico hasta su tripleta HSL, siguiendo un var() si hace falta. */
const resolver = (nombre, tema) => {
    const m = tema.match(new RegExp(`${nombre}:\\s*([^;]+);`));
    if (!m) return null;
    const valor = m[1].trim();
    const ref = valor.match(/^var\((--[a-z0-9-]+)\)/);
    return ref ? mapaPrimitivos[ref[1]] ?? null : valor;
};

const aRgb = (hsl) => {
    const [h, s, l] = hsl.split(/\s+/).map((v) => parseFloat(v));
    const sN = s / 100;
    const lN = l / 100;
    const c = (1 - Math.abs(2 * lN - 1)) * sN;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lN - c / 2;
    const seg = Math.floor(h / 60) % 6;
    const [r, g, b] = [
        [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
    ][seg];
    return [r + m, g + m, b + m];
};

const luminancia = (rgb) => {
    const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
};

const contraste = (a, b) => {
    const [la, lb] = [luminancia(aRgb(a)), luminancia(aRgb(b))];
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const TEMAS = [
    { nombre: 'claro', tema: claro },
    { nombre: 'oscuro', tema: oscuro },
];

// Tokens que se pintan como color de PRIMER PLANO sobre una superficie neutra.
const PRIMER_PLANO = [
    '--primary', '--accent-strong', '--destructive', '--success', '--warning', '--info',
    '--difficulty-easy', '--difficulty-medium', '--difficulty-hard',
    '--word-noun', '--word-verb', '--word-adjective', '--word-slang', '--word-idiom',
    '--rarity-basic', '--rarity-rare', '--rarity-epic', '--rarity-legendary',
    // `--input` es el limite visible de un control; `--border` se usa en
    // separadores decorativos, a los que no aplica el minimo de 1.4.11.
    '--input', '--ring',
];

// Pares superficie/texto: el fondo saturado y el color que va encima.
const PARES_SUPERFICIE = [
    ['--primary', '--primary-foreground'],
    ['--accent', '--accent-foreground'],
    ['--destructive', '--destructive-foreground'],
    ['--success', '--success-foreground'],
    ['--warning', '--warning-foreground'],
    ['--info', '--info-foreground'],
    ['--secondary', '--secondary-foreground'],
    ['--card', '--card-foreground'],
];

describe.each(TEMAS)('contraste en tema $nombre', ({ tema }) => {
    const fondo = () => resolver('--background', tema);
    const tarjeta = () => resolver('--card', tema);

    it('el texto principal alcanza 4.5:1 sobre fondo y sobre tarjeta', () => {
        const fg = resolver('--foreground', tema);
        expect(contraste(fg, fondo())).toBeGreaterThanOrEqual(4.5);
        expect(contraste(resolver('--card-foreground', tema), tarjeta())).toBeGreaterThanOrEqual(4.5);
    });

    it('el texto atenuado alcanza 4.5:1: es texto real, no decoracion', () => {
        const muted = resolver('--muted-foreground', tema);
        expect(contraste(muted, fondo())).toBeGreaterThanOrEqual(4.5);
        expect(contraste(muted, tarjeta())).toBeGreaterThanOrEqual(4.5);
    });

    it.each(PRIMER_PLANO)('%s alcanza 3:1 sobre fondo y sobre tarjeta', (token) => {
        const color = resolver(token, tema);
        expect(color, `${token} no esta definido en este tema`).toBeTruthy();
        const vsFondo = contraste(color, fondo());
        const vsTarjeta = contraste(color, tarjeta());
        expect(vsFondo, `${token} sobre bg-background: ${vsFondo.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
        expect(vsTarjeta, `${token} sobre bg-card: ${vsTarjeta.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    });

    it.each(PARES_SUPERFICIE)('el par %s / %s alcanza 4.5:1', (superficie, texto) => {
        const bg = resolver(superficie, tema);
        const fg = resolver(texto, tema);
        expect(bg, `${superficie} sin definir`).toBeTruthy();
        expect(fg, `${texto} sin definir`).toBeTruthy();
        const r = contraste(bg, fg);
        expect(r, `${superficie} con ${texto}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    });
});

describe('coherencia de la paleta', () => {
    it('cada token de primer plano existe en los dos temas', () => {
        const faltan = PRIMER_PLANO.filter((t) => !resolver(t, claro) || !resolver(t, oscuro));
        expect(faltan, `Sin par claro/oscuro: ${faltan.join(', ')}`).toEqual([]);
    });

    it('accent-strong es mas oscuro que accent en el tema claro', () => {
        // Es su razon de ser: el dorado de superficie no vale como texto.
        const l = (hsl) => parseFloat(hsl.split(/\s+/)[2]);
        expect(l(resolver('--accent-strong', claro))).toBeLessThan(l(resolver('--accent', claro)));
    });
});
