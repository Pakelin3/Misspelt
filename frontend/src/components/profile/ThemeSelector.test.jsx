import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import ThemeSelector from '@/components/profile/ThemeSelector';
import { ThemeProvider } from '@/context/ThemeContext';

/**
 * Antes de esto el selector de tema no era alcanzable desde ninguna parte de la
 * interfaz: `ThemeButton` existia pero no lo importaba ningun componente.
 *
 * Se prueban los tres estados porque "sistema" no es un punto medio entre claro y
 * oscuro: es delegar en el dispositivo, y con un interruptor binario no habria
 * forma de volver a esa opcion una vez abandonada.
 */
let escuchaSistema;

const mockMatchMedia = (prefiereOscuro) => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-color-scheme: dark') ? prefiereOscuro : false,
        media: query,
        addEventListener: (_, cb) => { escuchaSistema = cb; },
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }));
};

const montar = () => render(<ThemeProvider><ThemeSelector /></ThemeProvider>);

beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    escuchaSistema = undefined;
    mockMatchMedia(false);
});

describe('ThemeSelector', () => {
    it('ofrece las tres opciones como un grupo de radio accesible', () => {
        montar();
        const grupo = screen.getByRole('radiogroup', { name: /tema/i });
        expect(grupo).toBeInTheDocument();
        for (const etiqueta of ['Claro', 'Oscuro', 'Sistema']) {
            expect(screen.getByRole('radio', { name: new RegExp(etiqueta, 'i') })).toBeInTheDocument();
        }
    });

    it('arranca en "Sistema" cuando no hay preferencia guardada', () => {
        montar();
        expect(screen.getByRole('radio', { name: /sistema/i })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: /claro/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('al elegir Oscuro aplica la clase y la guarda', () => {
        montar();
        fireEvent.click(screen.getByRole('radio', { name: /oscuro/i }));

        expect(document.documentElement).toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(screen.getByRole('radio', { name: /oscuro/i })).toHaveAttribute('aria-checked', 'true');
    });

    it('al elegir Claro quita la clase oscura', () => {
        montar();
        fireEvent.click(screen.getByRole('radio', { name: /oscuro/i }));
        fireEvent.click(screen.getByRole('radio', { name: /claro/i }));

        expect(document.documentElement).not.toHaveClass('dark');
        expect(document.documentElement).toHaveClass('light');
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('volver a "Sistema" borra la preferencia guardada', () => {
        montar();
        fireEvent.click(screen.getByRole('radio', { name: /oscuro/i }));
        expect(localStorage.getItem('theme')).toBe('dark');

        fireEvent.click(screen.getByRole('radio', { name: /sistema/i }));
        // Borrarla, y no guardar la cadena "system", es lo que permite que el
        // script anti-parpadeo de index.html vuelva a consultar al SO al cargar.
        expect(localStorage.getItem('theme')).toBeNull();
    });

    it('en modo Sistema informa de que tema esta aplicando', () => {
        mockMatchMedia(true);
        montar();
        expect(screen.getByText(/siguiendo a tu dispositivo.*oscuro/i)).toBeInTheDocument();
        expect(document.documentElement).toHaveClass('dark');
    });

    it('en modo Sistema reacciona si el dispositivo cambia de tema', () => {
        montar();
        expect(document.documentElement).toHaveClass('light');

        // El SO pasa a oscuro mientras la app esta abierta.
        act(() => escuchaSistema?.({ matches: true }));
        expect(document.documentElement).toHaveClass('dark');
    });

    it('con una preferencia explicita ignora el cambio del dispositivo', () => {
        montar();
        fireEvent.click(screen.getByRole('radio', { name: /claro/i }));

        act(() => escuchaSistema?.({ matches: true }));
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
    });

    it('los botones cumplen el area tactil minima', () => {
        montar();
        for (const radio of screen.getAllByRole('radio')) {
            expect(radio.className).toMatch(/min-h-11/);
        }
    });
});
