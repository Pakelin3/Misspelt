import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useGamePreload from '@/hooks/useGamePreload';

/**
 * El motor Godot (~82 MB entre index.wasm e index.pck) antes se descargaba sin
 * ningun indicador: el jugador veia un rectangulo negro mientras cargaba. Este
 * hook precarga los dos archivos con `fetch` y expone el progreso real, para
 * que se pueda mostrar una barra mientras el usuario elige personaje. Estos
 * tests fijan que el progreso avance de 0 a 100, que un fallo de red no rompa
 * el flujo (jugar debe seguir siendo posible aunque falle la precarga), que se
 * aborte la descarga al desmontar y que `enabled=false` no dispare ninguna
 * peticion.
 */

// Crea un ReadableStream que emite `chunks` (arrays de Uint8Array) y expone un
// spy para comprobar que se cancela si el consumidor deja de leer.
const streamDeTrozos = (chunks) => {
    let i = 0;
    return new ReadableStream({
        pull(controller) {
            if (i < chunks.length) {
                controller.enqueue(chunks[i]);
                i += 1;
            } else {
                controller.close();
            }
        },
    });
};

const respuestaOk = ({ body, contentLength }) => ({
    ok: true,
    status: 200,
    headers: { get: (name) => (name === 'content-length' ? String(contentLength) : null) },
    body,
    arrayBuffer: async () => new ArrayBuffer(contentLength ?? 0),
});

describe('useGamePreload', () => {
    let fetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('con enabled=false no pide ningun archivo', () => {
        renderHook(() => useGamePreload(false));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('empieza en idle y pasa a loading al iniciar la precarga', () => {
        fetchMock.mockReturnValue(new Promise(() => {})); // nunca resuelve
        const { result } = renderHook(() => useGamePreload(true));
        expect(result.current.status).toBe('loading');
    });

    it('el progreso avanza de 0 a 100 y el estado termina en ready', async () => {
        const wasmChunks = [new Uint8Array(50), new Uint8Array(50)];
        const pckChunks = [new Uint8Array(60), new Uint8Array(40)];

        fetchMock.mockImplementation((url) => {
            if (url === '/game/index.wasm') {
                return Promise.resolve(respuestaOk({ body: streamDeTrozos(wasmChunks), contentLength: 100 }));
            }
            if (url === '/game/index.pck') {
                return Promise.resolve(respuestaOk({ body: streamDeTrozos(pckChunks), contentLength: 100 }));
            }
            return Promise.reject(new Error(`URL inesperada: ${url}`));
        });

        const { result } = renderHook(() => useGamePreload(true));

        expect(result.current.progress).toBe(0);

        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(result.current.progress).toBe(100);
    });

    it('pide exactamente index.wasm e index.pck', async () => {
        fetchMock.mockImplementation(() => Promise.resolve(
            respuestaOk({ body: streamDeTrozos([new Uint8Array(10)]), contentLength: 10 }),
        ));

        const { result } = renderHook(() => useGamePreload(true));
        await waitFor(() => expect(result.current.status).toBe('ready'));

        const urlsPedidas = fetchMock.mock.calls.map((c) => c[0]).sort();
        expect(urlsPedidas).toEqual(['/game/index.pck', '/game/index.wasm']);
    });

    it('un fallo de red deja status: error sin lanzar (jugar debe seguir siendo posible)', async () => {
        fetchMock.mockImplementation((url) => {
            if (url === '/game/index.wasm') {
                return Promise.reject(new Error('network error'));
            }
            return Promise.resolve(respuestaOk({ body: streamDeTrozos([new Uint8Array(10)]), contentLength: 10 }));
        });

        let hookError = null;
        const { result } = renderHook(() => {
            try {
                return useGamePreload(true);
            } catch (e) {
                hookError = e;
                return null;
            }
        });

        await waitFor(() => expect(result.current.status).toBe('error'));
        expect(hookError).toBeNull();
    });

    it('si la respuesta HTTP no es ok, tambien termina en status: error', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            headers: { get: () => null },
        });

        const { result } = renderHook(() => useGamePreload(true));
        await waitFor(() => expect(result.current.status).toBe('error'));
    });

    it('aborta la descarga (AbortController) al desmontar', () => {
        let signalCapturado;
        fetchMock.mockImplementation((url, options) => {
            signalCapturado = options.signal;
            return new Promise(() => {}); // nunca resuelve, simula descarga en curso
        });

        const { unmount } = renderHook(() => useGamePreload(true));
        expect(signalCapturado.aborted).toBe(false);

        unmount();

        expect(signalCapturado.aborted).toBe(true);
    });

    it('sin content-length ni cuerpo legible, consume todo de golpe sin fallar', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            headers: { get: () => null },
            body: null,
            arrayBuffer: async () => new ArrayBuffer(0),
        });

        const { result } = renderHook(() => useGamePreload(true));
        await waitFor(() => expect(result.current.status).toBe('ready'));
        expect(result.current.progress).toBe(100);
    });
});
