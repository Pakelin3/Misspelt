import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePageTitle from '@/hooks/usePageTitle';

/**
 * Antes todas las rutas compartian el titulo estatico de index.html, asi que
 * el historial del navegador y las pestañas abiertas eran indistinguibles
 * entre si. Este hook titula la pestaña por vista con el sufijo del producto
 * y restaura el titulo base al desmontar, para no dejar "fugado" el titulo de
 * una vista que ya no esta montada.
 */
const BASE_TITLE = 'Misspelt';

describe('usePageTitle', () => {
    afterEach(() => {
        document.title = '';
    });

    it('pone document.title con el sufijo del producto', () => {
        renderHook(() => usePageTitle('Diccionario'));
        expect(document.title).toBe('Diccionario · Misspelt');
    });

    it('usa solo el titulo base cuando no se pasa titulo', () => {
        renderHook(() => usePageTitle());
        expect(document.title).toBe(BASE_TITLE);
    });

    it('actualiza el titulo si cambia el valor entre renders', () => {
        const { rerender } = renderHook(({ title }) => usePageTitle(title), {
            initialProps: { title: 'Perfil' },
        });
        expect(document.title).toBe('Perfil · Misspelt');

        rerender({ title: 'Insignias' });
        expect(document.title).toBe('Insignias · Misspelt');
    });

    it('restaura el titulo base al desmontar', () => {
        const { unmount } = renderHook(() => usePageTitle('Diccionario'));
        expect(document.title).toBe('Diccionario · Misspelt');

        unmount();

        expect(document.title).toBe(BASE_TITLE);
    });
});
