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
        // La primera version buscaba `[100vh]` literal, asi que un
        // `h-[calc(100vh-72px)]` se le colaba: el `vh` no iba pegado al corchete
        // de cierre. Ahora se busca la unidad dentro de cualquier valor
        // arbitrario. Exigir un digito justo antes de `vh` es lo que distingue
        // el `100vh` que sobra del `100dvh` correcto, donde la `d` se interpone.
        const hits = scan(jsxFiles, /\[[^\]]*[0-9.]vh\b[^\]]*\]/);
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

    it('ningun control reimplementa a mano el aspecto de ui/Button', () => {
        // Habia 11 `<button>` (y un `<a>`) fuera de `ui/` que repetian a mano la
        // identidad del boton: `pixel-btn`, `border-4` y `shadow-pixel-*`. No era
        // un problema estetico sino de alcance: cuando el sistema de diseno
        // cambio — se quito el `uppercase` global y se rehizo la escala de
        // sombras — esos doce no recibieron el cambio y se descolgaron del resto
        // de la interfaz. Con dos de las tres senas ya se considera una copia.
        const SENAS = [/\bpixel-btn\b/, /\bborder-4\b/, /\bshadow-pixel-/];
        const hits = [];
        for (const file of jsxFiles.filter((f) => !f.includes('/ui/'))) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(/<(button|a)\b((?:[^>{]|\{[^{}]*\}|\{\{[^}]*\}\})*?)>/g)) {
                const copiadas = SENAS.filter((s) => s.test(m[2]));
                if (copiadas.length >= 2) {
                    const linea = text.slice(0, m.index).split('\n').length;
                    hits.push(`${relative(process.cwd(), file)}:${linea}  <${m[1]}> copia ${copiadas.length}/3 senas`);
                }
            }
        }
        expect(hits, `Usa <Button> (con asChild si necesitas un <a>):\n${report(hits)}`).toEqual([]);
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

    /**
     * Detector del par fondo/texto en hover. Vive aparte y se prueba con
     * cadenas literales porque la primera version tenia un agujero que solo se
     * ve con un caso concreto delante (ver los tests de mas abajo).
     */
    const PARES_HOVER = {
        primary: 'primary-foreground', accent: 'accent-foreground',
        destructive: 'destructive-foreground', success: 'success-foreground',
        warning: 'warning-foreground', info: 'info-foreground',
        secondary: 'secondary-foreground',
    };

    // Por debajo de este porcentaje el color de texto deja de cumplir su
    // funcion. 70 no es arbitrario: los pares *-foreground se eligieron con
    // 7:1 o mas sobre su fondo, y una opacidad del 70% sobre un fondo saturado
    // deja el contraste aun por encima del 4.5:1 que pide la WCAG 1.4.3. Por
    // debajo, no.
    const OPACIDAD_MINIMA = 70;

    const fallosDeParHover = (cls) => {
        const fallos = [];
        for (const [tono, fg] of Object.entries(PARES_HOVER)) {
            if (!new RegExp(`hover:bg-${tono}(?:/\\d+)?(?![\\w-])`).test(cls)) continue;

            // `(?![\w-])` y no `\b`: con `\b` la frontera cae justo antes de la
            // barra, asi que `hover:text-destructive-foreground/10` contaba como
            // "texto puesto". El grupo captura la opacidad para poder juzgarla.
            const puestos = [...cls.matchAll(
                // Solo el estado de reposo y el propio hover cuentan: un
                // `focus-visible:text-*` no arregla nada para quien usa raton.
                new RegExp(`(?:hover:|group-hover:)?text-${fg}(?:/(\\d+))?(?![\\w-])`, 'g'),
            )];

            if (puestos.length === 0) {
                fallos.push(`hover:bg-${tono} sin hover:text-${fg}`);
                continue;
            }
            const translucido = puestos.find(
                (p) => p[1] !== undefined && Number(p[1]) < OPACIDAD_MINIMA,
            );
            if (translucido) {
                fallos.push(
                    `${translucido[0]} sobre hover:bg-${tono}: el texto queda al ${translucido[1]}% `
                    + 'justo cuando el fondo se vuelve solido',
                );
            }
        }
        return fallos;
    };

    it('detecta el par ausente y la opacidad que lo anula', () => {
        // Caso limpio.
        expect(fallosDeParHover('text-destructive hover:bg-destructive hover:text-destructive-foreground')).toEqual([]);
        // Par ausente: el texto se queda en el color de reposo.
        expect(fallosDeParHover('text-foreground hover:bg-primary')).toHaveLength(1);

        // El agujero que tenia la version anterior de esta guardia. La opacidad
        // estaba pensada para el fondo (`hover:bg-destructive/10`) y un script de
        // emparejado automatico la dejo pegada al color del texto: al pasar el
        // raton el fondo se volvia rojo solido y el icono, que hereda el color por
        // currentColor, quedaba al 10%. Es decir, invisible precisamente en el
        // momento en que el usuario confirma que apunta al boton de borrar.
        for (const malo of [
            'text-destructive hover:bg-destructive hover:text-destructive-foreground/10',
            'text-info hover:bg-info hover:text-info-foreground/10',
            'text-primary hover:bg-primary hover:text-primary-foreground/20',
        ]) {
            expect(fallosDeParHover(malo), malo).toHaveLength(1);
        }

        // Una atenuacion legible sigue siendo legitima: el 80% de un
        // *-foreground sobre su propio fondo se lee sin esfuerzo, y se usa a
        // proposito en lineas de descripcion secundarias.
        expect(fallosDeParHover('hover:bg-primary group-hover:text-primary-foreground/80')).toEqual([]);
        // Y la opacidad sobre el FONDO, que es donde siempre debio estar, no es un fallo.
        expect(fallosDeParHover('hover:bg-destructive/10 hover:text-destructive-foreground')).toEqual([]);
    });

    it('todo hover a un fondo saturado lleva su color de texto, y opaco', () => {
        const hits = [];
        for (const file of jsxFiles) {
            const text = readFileSync(file, 'utf8');
            for (const m of text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
                const cls = m[1] ?? m[2] ?? '';
                for (const fallo of fallosDeParHover(cls)) {
                    hits.push(`${relative(process.cwd(), file)}  ${fallo}`);
                }
            }
        }
        expect(hits, `Anade el color de texto correspondiente, sin sufijo de opacidad:\n${report(hits)}`).toEqual([]);
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
    // Press Start 2P dibuja Á/É/Í/Ó/Ú/Ñ con el cuerpo comprimido para meter el
    // acento dentro de la altura de caja. A 12-24px se leen como minusculas y
    // parecen una errata ("INICIAR SESIóN"). Sus minusculas si estan bien
    // dibujadas, asi que la caja baja conserva la ortografia y se ve correcta.
    const ACENTUADA = /[ÁÉÍÓÚÑÜ]/;

    const sinComentarios = (texto) => texto
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, "");

    /**
     * Devuelve el texto visible de un archivo: los nodos de texto JSX y los
     * literales de cadena (aria-label, placeholder, alt, titulos de toast).
     *
     * La version anterior escaneaba LINEA A LINEA, asi que solo veia el texto
     * cuando `>`, el texto y `<` cabian en el mismo renglon. Un
     * `ESPERANDO VERIFICACIÓN...` escrito en su propia linea, que es como el
     * formateador deja cualquier texto medianamente largo, le pasaba por
     * delante sin verlo. Por eso ahora se recorre el archivo completo: el
     * `[^<>{}]+` cruza saltos de linea a proposito.
     */
    const textoVisible = (texto) => {
        const trozos = [];
        const anadir = (bruto, desde) => {
            const t = bruto.trim();
            if (!t) return;
            const idx = texto.indexOf(t, desde);
            trozos.push({ txt: t, linea: texto.slice(0, idx < 0 ? desde : idx).split('\n').length });
        };
        for (const m of texto.matchAll(/>([^<>{}]+)</g)) {
            for (const linea of m[1].split('\n')) anadir(linea, m.index);
        }
        for (const m of texto.matchAll(/"([^"\n]+)"|'([^'\n]+)'/g)) {
            anadir(m[1] ?? m[2], m.index);
        }
        return trozos;
    };

    const mayusculasAcentuadas = (texto) => textoVisible(sinComentarios(texto)).filter(
        ({ txt }) => txt.length > 2
            && ACENTUADA.test(txt)
            && txt === txt.toUpperCase()
            // Descarta expresiones y rutas: no son texto que lea nadie.
            && !/[=(){}]/.test(txt),
    );

    it('detecta el texto acentuado aunque ocupe su propia linea', () => {
        // El caso que se colaba: el texto no comparte renglon con sus etiquetas.
        const multilinea = [
            '<h2 className="font-mono text-lg">',
            '    ESPERANDO VERIFICACIÓN...',
            '</h2>',
        ].join('\n');
        expect(mayusculasAcentuadas(multilinea).map((h) => h.txt)).toEqual(['ESPERANDO VERIFICACIÓN...']);
        // El caso que ya se detectaba antes, en una sola linea.
        expect(mayusculasAcentuadas('<span>MECÁNICAS DE JUEGO</span>')).toHaveLength(1);
        // Y en un atributo.
        expect(mayusculasAcentuadas('<button aria-label="CERRAR SESIÓN" />')).toHaveLength(1);

        // Lo que no debe marcar: caja baja, mayusculas sin tilde, comentarios
        // que documentan justo este defecto, y expresiones de codigo.
        expect(mayusculasAcentuadas('<h2>Esperando verificación…</h2>')).toEqual([]);
        expect(mayusculasAcentuadas('<h2>CREAR CUENTA</h2>')).toEqual([]);
        expect(mayusculasAcentuadas('// antes decia ESPERANDO VERIFICACIÓN\n<h2>ok</h2>')).toEqual([]);
        expect(mayusculasAcentuadas('/* VERIFICACIÓN */\n<h2>ok</h2>')).toEqual([]);
    });

    it('no hay mayusculas acentuadas en texto todo-mayusculas', () => {
        const hits = [];
        for (const file of jsxFiles) {
            for (const { txt, linea } of mayusculasAcentuadas(readFileSync(file, 'utf8'))) {
                hits.push(`${relative(process.cwd(), file)}:${linea}  ${txt.slice(0, 50)}`);
            }
        }
        expect(hits, `Usa caja baja en su lugar:\n${report(hits)}`).toEqual([]);
    });
});
