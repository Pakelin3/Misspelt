import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePointerCapabilities from '@/hooks/usePointerCapabilities';

/**
 * El juego se controla con teclado y raton y no tiene mandos tactiles: en un
 * movil se descargaban 82 MB del motor para dejar al jugador con un personaje
 * que no puede moverse. Este hook distingue "puntero fino disponible" (raton o
 * trackpad) de "solo tactil" a partir de la media query `(pointer: fine)`,
 * para poder avisar antes de arrancar esa descarga.
 */

// Crea un mock de matchMedia que recuerda los listeners registrados para poder
// disparar un cambio de media query desde el test, y que devuelve siempre el
// mismo objeto para la misma query (como hace el navegador real).
const crearMatchMediaMock = (matchesInicial) => {
    const listeners = new Set();
    const mediaQueryList = {
        get matches() {
            return mediaQueryList._matches;
        },
        _matches: matchesInicial,
        media: '(pointer: fine)',
        addEventListener: vi.fn((event, handler) => {
            if (event === 'change') listeners.add(handler);
        }),
        removeEventListener: vi.fn((event, handler) => {
            if (event === 'change') listeners.delete(handler);
        }),
        // Helper de test: simula que el SO/navegador cambia la capacidad de
        // puntero (p.ej. se conecta o desconecta un raton).
        _dispatch(matches) {
            mediaQueryList._matches = matches;
            listeners.forEach((handler) => handler({ matches }));
        },
        _listeners: listeners,
    };
    const matchMediaMock = vi.fn(() => mediaQueryList);
    return { matchMediaMock, mediaQueryList };
};

describe('usePointerCapabilities', () => {
    let originalMatchMedia;

    beforeEach(() => {
        originalMatchMedia = window.matchMedia;
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
    });

    it('isTouchOnly es true cuando no hay puntero fino disponible', () => {
        const { matchMediaMock } = crearMatchMediaMock(false);
        window.matchMedia = matchMediaMock;

        const { result } = renderHook(() => usePointerCapabilities());

        expect(result.current.hasFinePointer).toBe(false);
        expect(result.current.isTouchOnly).toBe(true);
    });

    it('isTouchOnly es false cuando si hay puntero fino (raton/trackpad)', () => {
        const { matchMediaMock } = crearMatchMediaMock(true);
        window.matchMedia = matchMediaMock;

        const { result } = renderHook(() => usePointerCapabilities());

        expect(result.current.hasFinePointer).toBe(true);
        expect(result.current.isTouchOnly).toBe(false);
    });

    it('consulta la media query "(pointer: fine)"', () => {
        const { matchMediaMock } = crearMatchMediaMock(true);
        window.matchMedia = matchMediaMock;

        renderHook(() => usePointerCapabilities());

        expect(matchMediaMock).toHaveBeenCalledWith('(pointer: fine)');
    });

    it('reacciona cuando la media query cambia (se conecta/desconecta un raton)', () => {
        const { matchMediaMock, mediaQueryList } = crearMatchMediaMock(false);
        window.matchMedia = matchMediaMock;

        const { result } = renderHook(() => usePointerCapabilities());
        expect(result.current.isTouchOnly).toBe(true);

        act(() => {
            mediaQueryList._dispatch(true);
        });

        expect(result.current.hasFinePointer).toBe(true);
        expect(result.current.isTouchOnly).toBe(false);

        act(() => {
            mediaQueryList._dispatch(false);
        });

        expect(result.current.isTouchOnly).toBe(true);
    });

    it('limpia su listener de la media query al desmontar', () => {
        const { matchMediaMock, mediaQueryList } = crearMatchMediaMock(true);
        window.matchMedia = matchMediaMock;

        const { unmount } = renderHook(() => usePointerCapabilities());
        expect(mediaQueryList._listeners.size).toBe(1);

        unmount();

        expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        expect(mediaQueryList._listeners.size).toBe(0);
    });
});
