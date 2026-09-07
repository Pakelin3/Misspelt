import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * Red de seguridad de render: sin esto, una respuesta de API con forma
 * inesperada (un `.map()` sobre undefined en cualquier vista) desmontaba el
 * arbol entero y el usuario se quedaba mirando una pantalla en blanco, sin
 * ruta de salida. Estos tests fijan que el fallback se anuncie como alerta,
 * que ofrezca una salida real (reintentar o volver al inicio) y que
 * "intentar de nuevo" vuelva a renderizar el hijo.
 */

// Componente de prueba que lanza en el render, para forzar el
// getDerivedStateFromError del boundary.
const Bomba = ({ shouldThrow }) => {
    if (shouldThrow) throw new Error('boom');
    return <p>Contenido normal</p>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        // React registra el error en consola (dos veces: warning + boundary log);
        // se silencia para no ensuciar la salida de test con un error esperado.
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('renderiza normalmente a los hijos cuando no hay error', () => {
        render(
            <ErrorBoundary>
                <p>Contenido normal</p>
            </ErrorBoundary>,
        );
        expect(screen.getByText('Contenido normal')).toBeInTheDocument();
    });

    it('cuando un hijo lanza, muestra un role="alert" en vez de pantalla en blanco', () => {
        render(
            <ErrorBoundary>
                <Bomba shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByText('Contenido normal')).not.toBeInTheDocument();
    });

    it('ofrece una salida al usuario: reintentar y volver al inicio', () => {
        render(
            <ErrorBoundary>
                <Bomba shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('button', { name: /intentar de nuevo/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/');
    });

    it('permite personalizar el titulo y la descripcion del fallback', () => {
        render(
            <ErrorBoundary title="Fallo del diccionario" description="Intenta mas tarde.">
                <Bomba shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('heading', { name: 'Fallo del diccionario' })).toBeInTheDocument();
        expect(screen.getByText('Intenta mas tarde.')).toBeInTheDocument();
    });

    it('"intentar de nuevo" limpia el error y vuelve a renderizar el hijo', () => {
        // Mismo elemento <Bomba> a traves del reintento: cambia la prop para que,
        // al limpiarse el estado de error, el hijo ya no lance.
        const { rerender } = render(
            <ErrorBoundary>
                <Bomba shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toBeInTheDocument();

        rerender(
            <ErrorBoundary>
                <Bomba shouldThrow={false} />
            </ErrorBoundary>,
        );
        fireEvent.click(screen.getByRole('button', { name: /intentar de nuevo/i }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByText('Contenido normal')).toBeInTheDocument();
    });
});
