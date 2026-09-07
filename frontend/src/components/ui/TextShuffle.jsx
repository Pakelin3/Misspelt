import React, { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

const EMPTY_STYLE = {};

// Extraidas como funciones puras (y exportadas) para poder fijar el
// comportamiento del ResizeObserver sin doblar GSAP/SplitText/ScrollTrigger en
// el test: aqui vivia el defecto real (vigilar el ancho del propio `<span>`,
// que `build()` congela en px al construir) y es justo lo que un test debe
// poder probar con valores literales. No van a un modulo aparte (que evitaria
// el aviso de abajo) porque este archivo es el unico que este cambio puede
// tocar.
// eslint-disable-next-line react-refresh/only-export-components
export const elegirObjetivoObservador = (el) => el?.parentElement || el || null;

// eslint-disable-next-line react-refresh/only-export-components
export const debeReconstruir = (tamanoAnterior, tamanoActual, umbral = 0.5) =>
    Math.abs(tamanoActual - tamanoAnterior) >= umbral;

const TextShuffle = ({
    text,
    className = '',
    style = EMPTY_STYLE,
    shuffleDirection = 'right',
    duration = 0.35,
    maxDelay = 0,
    ease = 'power3.out',
    threshold = 0.1,
    rootMargin = '-100px',
    tag = 'p',
    textAlign = 'center',
    onShuffleComplete,
    shuffleTimes = 1,
    animationMode = 'evenodd',
    loop = false,
    loopDelay = 0,
    stagger = 0.03,
    scrambleCharset = '',
    colorFrom,
    colorTo,
    triggerOnce = true,
    respectReducedMotion = true,
    triggerOnHover = true
}) => {
    const ref = useRef(null);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [ready, setReady] = useState(false);

    const splitRef = useRef(null);
    const wrappersRef = useRef([]);
    const tlRef = useRef(null);
    const playingRef = useRef(false);
    const hoverHandlerRef = useRef(null);
    const roRef = useRef(null);

    const userHasFont = useMemo(
        () => (style && style.fontFamily) || (className && /font[-[]/i.test(className)),
        [style, className]
    );

    const scrollTriggerStart = useMemo(() => {
        const startPct = (1 - threshold) * 100;
        const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '');
        const mv = mm ? parseFloat(mm[1]) : 0;
        const mu = mm ? mm[2] || 'px' : 'px';
        const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
        return `top ${startPct}%${sign}`;
    }, [threshold, rootMargin]);

    useEffect(() => {
        // `document.fonts.ready` solo espera a las cargas PENDIENTES. Si la fuente
        // del elemento aun no se ha solicitado, resuelve de inmediato y medimos con
        // la tipografia de respaldo: en produccion eso daba ventanas de 38.4px para
        // glifos de 64px (el avance 0.6em del monospace generico) y el titulo salia
        // recortado y superpuesto. Hay que pedir la familia concreta y esperarla.
        let cancelado = false;
        const esperarFuente = async () => {
            if (!('fonts' in document)) return true;
            try {
                const el = ref.current;
                const familia = el ? getComputedStyle(el).fontFamily : '';
                const tamano = el ? getComputedStyle(el).fontSize : '1rem';
                if (familia) await document.fonts.load(`${tamano} ${familia}`);
                await document.fonts.ready;
            } catch { /* si falla, se mide con lo que haya */ }
            return true;
        };
        esperarFuente().then(() => { if (!cancelado) setFontsLoaded(true); });
        return () => { cancelado = true; };
    }, []);

    useGSAP(
        () => {
            if (!ref.current || !text || !fontsLoaded) return;

            if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                onShuffleComplete?.();
                return;
            }

            const el = ref.current;

            let computedFont = '';
            if (userHasFont) {
                computedFont = style.fontFamily || getComputedStyle(el).fontFamily || '';
            } else {
                computedFont = `'Press Start 2P', sans-serif`;
            }

            const start = scrollTriggerStart;

            const disconnectRo = () => {
                roRef.current?.disconnect();
                roRef.current = null;
            };

            const removeHover = () => {
                if (hoverHandlerRef.current && ref.current) {
                    ref.current.removeEventListener('mouseenter', hoverHandlerRef.current);
                    hoverHandlerRef.current = null;
                }
            };

            const teardown = () => {
                if (tlRef.current) {
                    tlRef.current.kill();
                    tlRef.current = null;
                }
                if (wrappersRef.current.length) {
                    wrappersRef.current.forEach(wrap => {
                        const inner = wrap.firstElementChild;
                        const orig = inner?.querySelector('[data-orig="1"]');
                        if (orig && wrap.parentNode) wrap.parentNode.replaceChild(orig, wrap);
                    });
                    wrappersRef.current = [];
                }
                try {
                    splitRef.current?.revert();
                } catch {
                    /* noop */
                }
                splitRef.current = null;
                playingRef.current = false;
            };

            const build = () => {
                teardown();

                splitRef.current = new GSAPSplitText(el, {
                    type: 'chars',
                    charsClass: 'shuffle-char',
                    wordsClass: 'shuffle-word',
                    linesClass: 'shuffle-line',
                    smartWrap: true,
                    reduceWhiteSpace: false
                });

                const chars = splitRef.current.chars || [];
                wrappersRef.current = [];

                const rolls = Math.max(1, Math.floor(shuffleTimes));
                const rand = set => set.charAt(Math.floor(Math.random() * set.length)) || '';

                chars.forEach(ch => {
                    const parent = ch.parentElement;
                    if (!parent) return;

                    const w = ch.getBoundingClientRect().width;
                    const h = ch.getBoundingClientRect().height;
                    if (!w) return;

                    const wrap = document.createElement('span');
                    wrap.className = 'inline-block overflow-hidden text-left';
                    Object.assign(wrap.style, {
                        width: w + 'px',
                        height: shuffleDirection === 'up' || shuffleDirection === 'down' ? h + 'px' : 'auto',
                        verticalAlign: 'bottom'
                    });

                    const inner = document.createElement('span');
                    inner.className =
                        'inline-block will-change-transform origin-left transform-gpu ' +
                        (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'whitespace-normal' : 'whitespace-nowrap');

                    parent.insertBefore(wrap, ch);
                    wrap.appendChild(inner);

                    const firstOrig = ch.cloneNode(true);
                    firstOrig.className =
                        'text-left ' + (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
                    Object.assign(firstOrig.style, { width: w + 'px', fontFamily: computedFont });

                    ch.setAttribute('data-orig', '1');
                    ch.className =
                        'text-left ' + (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
                    Object.assign(ch.style, { width: w + 'px', fontFamily: computedFont });

                    inner.appendChild(firstOrig);
                    for (let k = 0; k < rolls; k++) {
                        const c = ch.cloneNode(true);
                        if (scrambleCharset) c.textContent = rand(scrambleCharset);
                        c.className =
                            'text-left ' + (shuffleDirection === 'up' || shuffleDirection === 'down' ? 'block' : 'inline-block');
                        Object.assign(c.style, { width: w + 'px', fontFamily: computedFont });
                        inner.appendChild(c);
                    }
                    inner.appendChild(ch);

                    const steps = rolls + 1;

                    if (shuffleDirection === 'right' || shuffleDirection === 'down') {
                        const firstCopy = inner.firstElementChild;
                        const real = inner.lastElementChild;
                        if (real) inner.insertBefore(real, inner.firstChild);
                        if (firstCopy) inner.appendChild(firstCopy);
                    }

                    let startX = 0;
                    let finalX = 0;
                    let startY = 0;
                    let finalY = 0;

                    if (shuffleDirection === 'right') {
                        startX = -steps * w;
                        finalX = 0;
                    } else if (shuffleDirection === 'left') {
                        startX = 0;
                        finalX = -steps * w;
                    } else if (shuffleDirection === 'down') {
                        startY = -steps * h;
                        finalY = 0;
                    } else if (shuffleDirection === 'up') {
                        startY = 0;
                        finalY = -steps * h;
                    }

                    if (shuffleDirection === 'left' || shuffleDirection === 'right') {
                        gsap.set(inner, { x: startX, y: 0, force3D: true });
                        inner.setAttribute('data-start-x', String(startX));
                        inner.setAttribute('data-final-x', String(finalX));
                    } else {
                        gsap.set(inner, { x: 0, y: startY, force3D: true });
                        inner.setAttribute('data-start-y', String(startY));
                        inner.setAttribute('data-final-y', String(finalY));
                    }

                    if (colorFrom) inner.style.color = colorFrom;
                    wrappersRef.current.push(wrap);
                });
            };

            const inners = () => wrappersRef.current.map(w => w.firstElementChild);

            const randomizeScrambles = () => {
                if (!scrambleCharset) return;
                wrappersRef.current.forEach(w => {
                    const strip = w.firstElementChild;
                    if (!strip) return;
                    const kids = Array.from(strip.children);
                    for (let i = 1; i < kids.length - 1; i++) {
                        kids[i].textContent = scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));
                    }
                });
            };

            const cleanupToStill = () => {
                wrappersRef.current.forEach(w => {
                    const strip = w.firstElementChild;
                    if (!strip) return;
                    const real = strip.querySelector('[data-orig="1"]');
                    if (!real) return;
                    strip.replaceChildren(real);
                    strip.style.transform = 'none';
                    strip.style.willChange = 'auto';
                });
            };

            const play = () => {
                const strips = inners();
                if (!strips.length) return;

                playingRef.current = true;
                const isVertical = shuffleDirection === 'up' || shuffleDirection === 'down';

                const tl = gsap.timeline({
                    smoothChildTiming: true,
                    repeat: loop ? -1 : 0,
                    repeatDelay: loop ? loopDelay : 0,
                    onRepeat: () => {
                        if (scrambleCharset) randomizeScrambles();
                        if (isVertical) {
                            gsap.set(strips, { y: (i, t) => parseFloat(t.getAttribute('data-start-y') || '0') });
                        } else {
                            gsap.set(strips, { x: (i, t) => parseFloat(t.getAttribute('data-start-x') || '0') });
                        }
                        onShuffleComplete?.();
                    },
                    onComplete: () => {
                        playingRef.current = false;
                        if (!loop) {
                            cleanupToStill();
                            if (colorTo) gsap.set(strips, { color: colorTo });
                            onShuffleComplete?.();
                            armHover();
                        }
                    }
                });

                const addTween = (targets, at) => {
                    const vars = {
                        duration,
                        ease,
                        force3D: true,
                        stagger: animationMode === 'evenodd' ? stagger : 0
                    };
                    if (isVertical) {
                        vars.y = (i, t) => parseFloat(t.getAttribute('data-final-y') || '0');
                    } else {
                        vars.x = (i, t) => parseFloat(t.getAttribute('data-final-x') || '0');
                    }

                    tl.to(targets, vars, at);

                    if (colorFrom && colorTo) tl.to(targets, { color: colorTo, duration, ease }, at);
                };

                if (animationMode === 'evenodd') {
                    const odd = strips.filter((_, i) => i % 2 === 1);
                    const even = strips.filter((_, i) => i % 2 === 0);
                    const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
                    const evenStart = odd.length ? oddTotal * 0.7 : 0;
                    if (odd.length) addTween(odd, 0);
                    if (even.length) addTween(even, evenStart);
                } else {
                    strips.forEach(strip => {
                        const d = Math.random() * maxDelay;
                        const vars = {
                            duration,
                            ease,
                            force3D: true
                        };
                        if (isVertical) {
                            vars.y = parseFloat(strip.getAttribute('data-final-y') || '0');
                        } else {
                            vars.x = parseFloat(strip.getAttribute('data-final-x') || '0');
                        }
                        tl.to(strip, vars, d);
                        if (colorFrom && colorTo) tl.fromTo(strip, { color: colorFrom }, { color: colorTo, duration, ease }, d);
                    });
                }

                tlRef.current = tl;
            };

            const armHover = () => {
                if (!triggerOnHover || !ref.current) return;
                removeHover();
                const handler = () => {
                    if (playingRef.current) return;
                    build();
                    if (scrambleCharset) randomizeScrambles();
                    play();
                };
                hoverHandlerRef.current = handler;
                ref.current.addEventListener('mouseenter', handler);
            };

            const create = () => {
                build();
                if (scrambleCharset) randomizeScrambles();
                play();
                armHover();
                setReady(true);
            };

            const st = ScrollTrigger.create({ trigger: el, start, once: triggerOnce, onEnter: create });

            // Las ventanas de cada letra llevan un ancho fijo en px calculado al
            // construir, asi que hace falta reconstruir cuando cambie el tamano de
            // fuente (viene de un clamp() fluido en className, pero un consumidor
            // puede pasar cualquier otra cosa). OJO: no sirve vigilar el ancho de
            // `el` con un ResizeObserver sobre el propio `<span>` -asi estaba antes-
            // porque `el` es inline-block y su contenido son precisamente esas
            // ventanas de ancho fijo que build() acaba de congelar: el ResizeObserver
            // vigilaria una consecuencia de build(), no su causa, y tras el primer
            // render el ancho de `el` deja de moverse aunque el viewport cambie. La
            // señal que de verdad manda es el font-size computado, y hay que medirlo
            // en un elemento cuyo tamano si siga al viewport: el padre en bloque
            // (normalmente el <h1>), con fallback a `el` si no hay padre.
            const objetivoRo = elegirObjetivoObservador(el);
            let tamanoPrevio = parseFloat(getComputedStyle(el).fontSize) || 0;
            let rafPendiente = null;
            const ro = new ResizeObserver(() => {
                // El observador puede dispararse en rafaga mientras se arrastra el
                // borde de la ventana; build() hace SplitText + crea nodos por cada
                // caracter, asi que se amortigua a un rebuild por frame.
                if (rafPendiente != null) cancelAnimationFrame(rafPendiente);
                rafPendiente = requestAnimationFrame(() => {
                    rafPendiente = null;
                    const tamanoActual = parseFloat(getComputedStyle(el).fontSize) || 0;
                    if (!debeReconstruir(tamanoPrevio, tamanoActual)) return;
                    // El tamano solo se da por atendido si de verdad se reconstruye.
                    // Si se apuntara antes de esta guardia, un redimensionado que
                    // cayera dentro del segundo que dura la animacion se registraria
                    // como visto sin haber reconstruido nada, y el titulo se quedaria
                    // con las ventanas del tamano viejo hasta el siguiente cambio.
                    if (playingRef.current) return;
                    tamanoPrevio = tamanoActual;
                    build();
                    if (scrambleCharset) randomizeScrambles();
                    play();
                });
            });
            ro.observe(objetivoRo);
            roRef.current = ro;

            return () => {
                st.kill();
                if (rafPendiente != null) cancelAnimationFrame(rafPendiente);
                disconnectRo();
                removeHover();
                teardown();
                setReady(false);
            };
        },
        {
            dependencies: [
                text,
                duration,
                maxDelay,
                ease,
                scrollTriggerStart,
                fontsLoaded,
                shuffleDirection,
                shuffleTimes,
                animationMode,
                loop,
                loopDelay,
                stagger,
                scrambleCharset,
                colorFrom,
                colorTo,
                triggerOnce,
                respectReducedMotion,
                triggerOnHover,
                onShuffleComplete,
                userHasFont
            ],
            scope: ref
        }
    );

    // El tamaño era `text-[4rem]` fijo: 64px por caracter en cualquier viewport, asi
    // que un titulo de 8 letras medía 512px y se salía de pantalla en un movil de
    // 360px. Ahora escala con el ancho disponible y `className` puede sobreescribirlo.
    const baseTw = 'inline-block whitespace-normal break-words will-change-transform uppercase text-[clamp(1.75rem,10vw,4rem)] leading-none';
    const classes = useMemo(
        () => `${baseTw} ${ready ? 'visible' : 'invisible'} ${className}`.trim(),
        [baseTw, ready, className]
    );
    const Tag = tag || 'p';
    const commonStyle = useMemo(() => ({ textAlign, ...style }), [textAlign, style]);

    // El efecto clona cada caracter varias veces dentro del DOM, asi que el
    // nombre accesible del elemento acababa siendo "MMMIIISSSPPP...". Se declara
    // el texto real con aria-label y se oculta el andamiaje al arbol de a11y.
    return React.createElement(
        Tag,
        {
            ref: ref,
            className: classes,
            style: commonStyle,
            'aria-label': text,
            children: React.createElement('span', { 'aria-hidden': 'true' }, text),
        },
    );
};

export default TextShuffle;
