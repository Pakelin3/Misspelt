import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Guardia del contrato de UI (`CONTRIBUTING-UI.md`).
 *
 * La auditoria del 2026-08-17 encontro 265 colores crudos, 289 valores
 * arbitrarios de sombra, 21 clases `font-pixel` inexistentes y 12 variables CSS
 * que no estaban definidas en ninguna parte. Todo eso se arreglo; estos tests
 * existen para que no vuelva, porque un ojo humano no detecta la reaparicion de
 * un `bg-yellow-400` en una revision de codigo.
 */

const SRC = join(process.cwd(), 'src');

const walk = (dir) => {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...walk(full));
        else out.push(full);
    }
    return out;
};

const allFiles = walk(SRC);
const jsxFiles = allFiles.filter((f) => f.endsWith('.jsx') && !f.includes('.test.'));
const cssText = readFileSync(join(SRC, 'index.css'), 'utf8');

const report = (hits) => hits.map((h) => `  ${h}`).join('\n');

const scan = (files, regex) => {
    const hits = [];
    for (const file of files) {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
            // Ignorar comentarios: documentan lo que ya se corrigio.
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
            const found = line.match(regex);
            if (found) hits.push(`${relative(process.cwd(), file)}:${i + 1}  ${found[0]}`);
        });
    }
    return hits;
};

const PALETAS = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone';

describe('contrato de color', () => {
    it('ninguna vista usa la paleta cruda de Tailwind', () => {
        const hits = scan(jsxFiles, new RegExp(`\\b(bg|text|border|ring|from|to|via)-(${PALETAS})-[0-9]{2,3}\\b`));
        expect(hits, `Usa un token semantico en su lugar:\n${report(hits)}`).toEqual([]);
    });

    it('no se usan text-white / bg-white / text-black fuera de las excepciones documentadas', () => {
        // GamePage: letterbox negro del canvas del juego.
        // Login/Register: el boton de Google exige blanco por guia de marca.
        const EXCEPCIONES = ['GamePage', 'LoginPage', 'RegisterPage'];
        const hits = scan(jsxFiles, /\b(text-white|bg-white|text-black)\b/)
            .filter((h) => !EXCEPCIONES.some((e) => h.includes(e)));
        expect(hits, `Usa *-foreground / *-background:\n${report(hits)}`).toEqual([]);
    });

    it('no quedan rgba(var(--token)) — es sintaxis invalida y el navegador la descarta', () => {
        const hits = scan(jsxFiles, /rgba\(var\(--/);
        expect(hits, `Usa la sintaxis de slash (bg-primary/50) o color-mix():\n${report(hits)}`).toEqual([]);
    });
});

describe('contrato de escalas', () => {
    it('no hay sombras con valor arbitrario', () => {
        const hits = scan(jsxFiles, /shadow-\[/);
        expect(hits, `Usa shadow-pixel-*:\n${report(hits)}`).toEqual([]);
    });

    it('no hay tamanos de texto en px arbitrarios', () => {
        const hits = scan(jsxFiles, /\btext-\[[0-9.]+(px|rem)\]/);
        expect(hits, `Usa la escala (incluidos text-2xs y text-3xs):\n${report(hits)}`).toEqual([]);
    });

    it('no hay z-index arbitrarios ni numericos altos', () => {
        const hits = scan(jsxFiles, /\bz-(\[[0-9]+\]|50|60|70|80|90|100)\b/);
        expect(hits, `Usa la escala de capas (z-navbar, z-modal, ...):\n${report(hits)}`).toEqual([]);
    });

    it('no se usa font-pixel: nunca existio como token', () => {
        const hits = scan(jsxFiles, /\bfont-pixel\b/);
        expect(hits, `Usa font-mono (display) o font-sans (cuerpo):\n${report(hits)}`).toEqual([]);
    });

    it('usa dvh y no vh en alturas de viewport', () => {
        const hits = scan(jsxFiles, /\[[0-9]+vh\]/);
        expect(hits, `En movil la barra del navegador entra en el calculo de vh:\n${report(hits)}`).toEqual([]);
    });
});

describe('contrato de tokens CSS', () => {
    it('toda var(--color-*) usada en JSX esta definida en index.css', () => {
        const usadas = new Set();
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
                // Solo comprobamos las que el JSX referencia directamente.
                if (!text.slice(0, m.index).trimEnd().endsWith('//')) usadas.add(m[1]);
            }
        }
        const noDefinidas = [...usadas].filter((v) => !cssText.includes(`${v}:`));
        expect(noDefinidas, `Variables CSS referenciadas y no definidas: ${noDefinidas.join(', ')}`).toEqual([]);
    });

    it('define el bloque .dark: sin el, el selector de tema no cambia nada', () => {
        expect(cssText).toMatch(/\.dark\s*\{/);
        expect(cssText).toContain('@custom-variant dark');
    });

    it('cada token semantico tiene su par en el tema oscuro', () => {
        const bloque = (selector) => {
            const i = cssText.indexOf(selector);
            return cssText.slice(i, cssText.indexOf('\n  }', i));
        };
        const nombres = (texto) => new Set([...texto.matchAll(/^\s{4}(--[a-z-]+):/gm)].map((m) => m[1]));

        const claros = nombres(bloque('  :root {\n    --background'));
        const oscuros = nombres(bloque('  .dark {'));
        const sinPar = [...claros].filter((n) => !oscuros.has(n) && n !== '--radius');

        expect(sinPar, `Tokens sin variante oscura: ${sinPar.join(', ')}`).toEqual([]);
    });

    it('neutraliza el movimiento bajo prefers-reduced-motion', () => {
        expect(cssText).toContain('prefers-reduced-motion');
    });
});

describe('contrato de seguridad', () => {
    it('ninguna clave de servicio llega al cliente via VITE_', () => {
        const hits = scan(allFiles.filter((f) => /\.(jsx?|js)$/.test(f) && !f.includes('.test.')),
            /import\.meta\.env\.VITE_[A-Z_]*(KEY|SECRET|TOKEN|PAT)[A-Z_]*/);
        expect(hits, `Vite las inlinea en el bundle publico. Proxy en el backend:\n${report(hits)}`).toEqual([]);
    });

    it('no se llama a APIs de terceros directamente desde el navegador', () => {
        const hits = scan(jsxFiles, /https:\/\/api\.(elevenlabs|github|openai)\.com/);
        expect(hits, `Debe pasar por un endpoint del backend:\n${report(hits)}`).toEqual([]);
    });

    it('no se usa alert() ni window.confirm() para hablar con el usuario', () => {
        const hits = scan(jsxFiles, /(?<!\w)(window\.)?(alert|confirm)\s*\(/)
            .filter((h) => !/showAlert|role="alert"/.test(h));
        expect(hits, `Usa sonner o un nodo role="alert":\n${report(hits)}`).toEqual([]);
    });
});

describe('contrato de accesibilidad', () => {
    it('ningun modal de negocio reimplementa un overlay a mano', () => {
        const hits = scan(jsxFiles.filter((f) => !f.includes('/ui/')), /className="fixed inset-0[^"]*"\s+onClick=/);
        expect(hits, `Usa ui/Dialog (Radix): aporta focus trap, Escape y aria-modal:\n${report(hits)}`).toEqual([]);
    });

    it('no se elimina el outline de foco sin un reemplazo visible', () => {
        const hits = [];
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
                const cls = m[1] ?? m[2] ?? '';
                const quita = /\b(focus:outline-none|outline-none)\b/.test(cls);
                const repone = /focus-visible:ring|focus:ring|focus-visible:outline/.test(cls);
                if (quita && !repone) {
                    hits.push(`${relative(process.cwd(), file)}  ${cls.trim().slice(0, 70)}`);
                }
            }
        }
        expect(hits, `Anade focus-visible:ring-2 ring-ring:\n${report(hits)}`).toEqual([]);
    });
});

describe('contraste y color heredado', () => {
    it('los iconos monocromos pintan con currentColor, no con un color fijo', () => {
        // Con `fill="black"` ninguna clase text-* afectaba al icono, asi que en el
        // tema oscuro quedaban negros sobre fondo negro. Los iconos multicolor
        // (fuego, rayo, diana) si llevan color propio: forma parte del dibujo.
        const hits = [];
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            for (const bloque of text.split(/(?=export function )/)) {
                const nombre = bloque.match(/export function (\w+)/)?.[1];
                if (!nombre) continue;
                const esMulticolor = /(fill|stroke)="#[0-9a-fA-F]{3,8}"/.test(bloque);
                if (esMulticolor) continue;
                if (/(fill|stroke)="(black|white|#000|#000000|#fff|#ffffff)"/.test(bloque)) {
                    hits.push(`${relative(process.cwd(), file)}  ${nombre}`);
                }
            }
        }
        expect(hits, `Usa fill="currentColor":\n${report(hits)}`).toEqual([]);
    });

    it('todo hover a un fondo saturado lleva su color de texto', () => {
        // Si el fondo salta a primary/destructive pero el texto se queda en
        // text-foreground, el resultado es ilegible en al menos uno de los temas.
        const PARES = {
            primary: 'primary-foreground', accent: 'accent-foreground',
            destructive: 'destructive-foreground', success: 'success-foreground',
            warning: 'warning-foreground', info: 'info-foreground',
            secondary: 'secondary-foreground',
        };
        const hits = [];
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
                const cls = m[1] ?? m[2] ?? '';
                for (const [tono, fg] of Object.entries(PARES)) {
                    const salta = new RegExp(`hover:bg-${tono}\\b`).test(cls);
                    const cubierto = new RegExp(`hover:text-${fg}\\b|\\btext-${fg}\\b`).test(cls);
                    if (salta && !cubierto) {
                        hits.push(`${relative(process.cwd(), file)}  hover:bg-${tono} sin hover:text-${fg}`);
                    }
                }
            }
        }
        expect(hits, `Anade el color de texto correspondiente:\n${report(hits)}`).toEqual([]);
    });

    it('ningun color fijo por marca cambia de fondo al hacer hover', () => {
        // El boton de Google mantiene fondo blanco y texto negro por guia de marca.
        // Si el hover lo cambiara a un token del tema (hover:bg-muted), en oscuro
        // el texto negro quedaria sobre un fondo oscuro.
        const hits = [];
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
                const cls = m[1] ?? m[2] ?? '';
                const fijo = /\b(bg-white|text-black)\b/.test(cls);
                const hoverTema = /hover:bg-(?!white)[a-z-]+/.test(cls);
                if (fijo && hoverTema) {
                    hits.push(`${relative(process.cwd(), file)}  ${cls.trim().slice(0, 80)}`);
                }
            }
        }
        expect(hits, `Usa hover:brightness-* en lugar de un token del tema:\n${report(hits)}`).toEqual([]);
    });
});

describe('tipografia display', () => {
    it('no hay mayusculas acentuadas en texto todo-mayusculas', () => {
        // Press Start 2P dibuja Á/É/Í/Ó/Ú/Ñ con el cuerpo comprimido para meter el
        // acento dentro de la altura de caja. A 12-24px se leen como minusculas y
        // parecen una errata ("INICIAR SESIóN"). Sus minusculas si estan bien
        // dibujadas, asi que la caja baja conserva la ortografia y se ve correcta.
        const acentuada = /[ÁÉÍÓÚÑÜ]/;
        const hits = [];
        for (const file of jsxFiles) {
            readFileSync(file, 'utf8').split('\n').forEach((linea, i) => {
                const t = linea.trim();
                if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
                const trozos = linea.matchAll(/>([^<>{}]*[ÁÉÍÓÚÑÜ][^<>{}]*)<|"([^"]*[ÁÉÍÓÚÑÜ][^"]*)"|'([^']*[ÁÉÍÓÚÑÜ][^']*)'/g);
                for (const m of trozos) {
                    const txt = (m[1] ?? m[2] ?? m[3] ?? '').trim();
                    if (txt.length > 2 && acentuada.test(txt) && txt === txt.toUpperCase()) {
                        hits.push(`${relative(process.cwd(), file)}:${i + 1}  ${txt.slice(0, 50)}`);
                    }
                }
            });
        }
        expect(hits, `Usa caja baja en su lugar:\n${report(hits)}`).toEqual([]);
    });
});
