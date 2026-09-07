import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import TextShuffle, { elegirObjetivoObservador, debeReconstruir } from '@/components/ui/TextShuffle';

/*
 * TextShuffle depende de GSAP + SplitText + ScrollTrigger, que miden layout real
 * (getBoundingClientRect) y no tienen sentido en jsdom (siempre da 0, no hay
 * motor de layout). Doblar esas tres librerias por completo para reproducir el
 * bug real habria sido fragil de mantener, asi que la decision que causaba el
 * defecto -CUANDO reconstruir y SOBRE QUE elemento observar- se extrajo a dos
 * funciones puras (`debeReconstruir` / `elegirObjetivoObservador`) que se
 * prueban abajo con valores literales, sin GSAP de por medio. El resto del
 * archivo es un test de integracion mas ligero, con gsap/SplitText/
 * ScrollTrigger doblados al minimo indispensable, que fija el enganche real del
 * ResizeObserver (observa al padre, no al propio `<span>`) y su desconexion al
 * desmontar: ahi es donde vivia el bug, y una funcion pura sola no lo demuestra.
 */

const { finDeAnimacion } = vi.hoisted(() => ({ finDeAnimacion: { cb: null } }));
vi.mock('gsap', () => ({
    gsap: {
        registerPlugin: vi.fn(),
        set: vi.fn(),
        // `kill` hace falta porque el teardown del componente lo llama sobre el
        // timeline guardado, y con caracteres reales ese timeline si se crea.
        // Se guarda tambien el `onComplete` que le pasa el componente: es la unica
        // forma de que el test pueda dar la animacion por terminada, porque el
        // GSAP real es quien lo dispara y aqui no hay reloj.
        timeline: vi.fn((vars) => {
            finDeAnimacion.cb = vars?.onComplete || null;
            return { to: vi.fn(), fromTo: vi.fn(), kill: vi.fn() };
        }),
    },
}));

vi.mock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: { create: vi.fn(() => ({ kill: vi.fn() })) },
}));

// `new GSAPSplitText(...)` necesita un constructor de verdad (una arrow function
// no puede invocarse con `new`). Devolver un objeto explicitamente hace que
// `new` use ese objeto en vez de `this`, sin chars para no montar el andamiaje
// de columnas/animacion, que aqui no aporta nada a lo que se quiere probar.
const { splitTextCtor, conCaracteres } = vi.hoisted(() => ({
    splitTextCtor: vi.fn(),
    // Interruptor del doble: por defecto no devuelve caracteres (basta para
    // comprobar el enganche del observador). Al activarlo devuelve un caracter
    // real, que es lo minimo para que `build()` cree su ventana y `play()` llegue
    // a marcar `playingRef` — la rama que hace falta para el ultimo test.
    conCaracteres: { valor: false },
}));
vi.mock('gsap/SplitText', () => ({
    SplitText: function SplitTextMock(el, ...args) {
        splitTextCtor(el, ...args);
        if (!conCaracteres.valor) return { chars: [], revert: vi.fn() };
        const ch = document.createElement('span');
        ch.textContent = 'M';
        (el?.firstElementChild || el)?.appendChild(ch);
        return { chars: [ch], revert: vi.fn() };
    },
}));

// Se sustituye por un useEffect corriente: solo interesa que el callback de
// TextShuffle se ejecute (para que arme el ResizeObserver) y que su cleanup se
// dispare al desmontar o cambiar dependencias, no el scoping/auto-revert real
// de GSAP.
vi.mock('@gsap/react', () => ({
    useGSAP: (callback, opts) => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        React.useEffect(() => callback(), opts?.dependencies || []);
    },
}));

describe('elegirObjetivoObservador (unidad)', () => {
    it('devuelve el padre cuando existe', () => {
        const padre = {};
        const el = { parentElement: padre };
        expect(elegirObjetivoObservador(el)).toBe(padre);
    });

    it('cae al propio elemento si no tiene padre', () => {
        const el = { parentElement: null };
        expect(elegirObjetivoObservador(el)).toBe(el);
    });

    it('devuelve null si no hay elemento', () => {
        expect(elegirObjetivoObservador(null)).toBeNull();
    });
});

describe('debeReconstruir (unidad)', () => {
    it('no reconstruye si el tamano de fuente no cambio', () => {
        expect(debeReconstruir(16, 16)).toBe(false);
    });

    it('no reconstruye por diferencias de redondeo subpixel', () => {
        expect(debeReconstruir(16, 16.2)).toBe(false);
    });

    it('reconstruye cuando el tamano de fuente cambia por encima del umbral, con el ancho del elemento constante', () => {
        // Caso exacto que el ResizeObserver anterior dejaba pasar: el clamp()
        // cambia el font-size al redimensionar el viewport, pero el ancho de
        // `el` (congelado en px por build()) no se mueve, asi que vigilar el
        // ancho nunca detectaba este cambio.
        expect(debeReconstruir(28.8, 51.2)).toBe(true);
    });

    it('admite un umbral personalizado', () => {
        expect(debeReconstruir(16, 16.4, 1)).toBe(false);
        expect(debeReconstruir(16, 17.1, 1)).toBe(true);
    });
});

describe('TextShuffle (integracion ligera del ResizeObserver)', () => {
    let instanciasRO;
    let fontSizeActual;

    class ResizeObserverEspia {
        constructor(cb) {
            this.cb = cb;
            this.objetivos = [];
            this.desconectado = false;
            instanciasRO.push(this);
        }
        observe(target) { this.objetivos.push(target); }
        unobserve() { /* no usado por el componente */ }
        disconnect() { this.desconectado = true; }
    }

    beforeEach(() => {
        instanciasRO = [];
        fontSizeActual = '16px';
        conCaracteres.valor = false;
        finDeAnimacion.cb = null;
        splitTextCtor.mockClear();

        vi.stubGlobal('ResizeObserver', ResizeObserverEspia);
        // Se ejecuta sincrono: el amortiguado por rAF es un detalle de
        // rendimiento (no reconstruir decenas de veces por segundo durante un
        // arrastre), no algo que este test necesite verificar.
        vi.stubGlobal('requestAnimationFrame', (cb) => { cb(); return 1; });
        vi.stubGlobal('cancelAnimationFrame', () => {});

        vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
            fontFamily: 'sans-serif',
            fontSize: fontSizeActual,
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('observa al padre del elemento, no al propio span (asi es como fallaba antes)', async () => {
        render(<TextShuffle text="MISSPELT" tag="span" />);

        await waitFor(() => expect(instanciasRO).toHaveLength(1));

        const [ro] = instanciasRO;
        expect(ro.objetivos).toHaveLength(1);

        const el = document.querySelector('[aria-label="MISSPELT"]');
        expect(el).not.toBeNull();
        expect(ro.objetivos[0]).toBe(el.parentElement);
        expect(ro.objetivos[0]).not.toBe(el);
    });

    it('un cambio de fontSize computado, con el ancho del elemento constante, dispara una reconstruccion', async () => {
        render(<TextShuffle text="MISSPELT" tag="span" />);
        await waitFor(() => expect(instanciasRO).toHaveLength(1));

        const llamadasIniciales = splitTextCtor.mock.calls.length;
        const [ro] = instanciasRO;

        // El viewport se estrecha: el clamp() del className cambia el font-size.
        // Nada en el DOM (real o simulado) mueve el ancho de `el` -jsdom no hace
        // layout, y en produccion tampoco lo haria mientras las ventanas de cada
        // letra sigan con su ancho fijo- asi que la unica senal disponible es el
        // font-size computado que se dobla arriba.
        fontSizeActual = '28px';
        act(() => { ro.cb(); });

        expect(splitTextCtor.mock.calls.length).toBeGreaterThan(llamadasIniciales);
    });

    it('no reconstruye si el ResizeObserver se dispara sin que cambie el tamano', async () => {
        render(<TextShuffle text="MISSPELT" tag="span" />);
        await waitFor(() => expect(instanciasRO).toHaveLength(1));

        const llamadasIniciales = splitTextCtor.mock.calls.length;
        const [ro] = instanciasRO;

        act(() => { ro.cb(); });

        expect(splitTextCtor.mock.calls.length).toBe(llamadasIniciales);
    });

    it('desconecta el ResizeObserver al desmontar', async () => {
        const { unmount } = render(<TextShuffle text="MISSPELT" tag="span" />);
        await waitFor(() => expect(instanciasRO).toHaveLength(1));

        const [ro] = instanciasRO;
        expect(ro.desconectado).toBe(false);

        unmount();

        expect(ro.desconectado).toBe(true);
    });

    // Resto que quedaba tras arreglar el observador: el tamano nuevo se apuntaba
    // como atendido ANTES de la guardia de `playingRef`, asi que un redimensionado
    // que cayera dentro del segundo que dura la animacion se registraba como visto
    // sin haber reconstruido nada, y el titulo se quedaba con las ventanas del
    // tamano viejo hasta que alguien volviera a mover la ventana.
    it('un redimensionado durante la animacion no se da por atendido', async () => {
        conCaracteres.valor = true;
        // build() descarta los caracteres que miden 0, y en jsdom todo mide 0.
        vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, x: 0, y: 0,
        });

        render(<TextShuffle text="M" tag="span" />);
        await waitFor(() => expect(instanciasRO.length).toBeGreaterThan(0));
        const [ro] = instanciasRO;

        // 1. Primer cambio de tamano: construye y arranca la animacion.
        fontSizeActual = '48px';
        await act(async () => { ro.cb([]); });
        const trasPrimera = splitTextCtor.mock.calls.length;
        expect(trasPrimera).toBeGreaterThan(0);
        expect(finDeAnimacion.cb, 'la animacion deberia estar en curso').toBeTypeOf('function');

        // 2. Segundo cambio, ahora con la animacion corriendo: no debe reconstruir.
        fontSizeActual = '64px';
        await act(async () => { ro.cb([]); });
        expect(splitTextCtor.mock.calls.length, 'no reconstruye mientras anima').toBe(trasPrimera);

        // 3. Termina la animacion y llega otro aviso del observador con el MISMO
        //    tamano de 64px. Si el paso 2 se hubiera apuntado como atendido,
        //    `debeReconstruir` diria que no hay cambio y el titulo se quedaria con
        //    las ventanas de 48px para siempre. Debe reconstruir.
        await act(async () => { finDeAnimacion.cb(); });
        await act(async () => { ro.cb([]); });
        expect(splitTextCtor.mock.calls.length, 'el cambio seguia pendiente, no consumido')
            .toBeGreaterThan(trasPrimera);
    });
});
