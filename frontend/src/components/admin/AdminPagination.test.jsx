import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import AdminPagination from '@/components/admin/AdminPagination';

/**
 * AdminPagination es compartido por Insignias y Avatares. Un profesor que
 * pulsa "SIGUIENTE" en la ultima pagina (o "ANTERIOR" en la primera) no
 * deberia poder disparar una llamada a una pagina que no existe; y alguien
 * que navega sin raton necesita saber en que pagina esta sin depender solo
 * del color.
 */
describe('AdminPagination', () => {
    it('deshabilita ANTERIOR en la primera pagina', () => {
        render(<AdminPagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
        expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled();
    });

    it('deshabilita SIGUIENTE en la ultima pagina', () => {
        render(<AdminPagination currentPage={5} totalPages={5} onPageChange={() => {}} />);
        expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /anterior/i })).toBeEnabled();
    });

    it('ambos botones estan habilitados en una pagina intermedia', () => {
        render(<AdminPagination currentPage={3} totalPages={5} onPageChange={() => {}} />);
        expect(screen.getByRole('button', { name: /anterior/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled();
    });

    it('SIGUIENTE avanza una pagina', () => {
        const onPageChange = vi.fn();
        render(<AdminPagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('ANTERIOR retrocede una pagina', () => {
        const onPageChange = vi.fn();
        render(<AdminPagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('muestra la pagina actual y el total como texto visible', () => {
        render(<AdminPagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
        expect(screen.getByText(/página 2 de 5/i)).toBeInTheDocument();
    });

    // BUG REAL: el indicador "Página X de Y" es un <span> plano, sin
    // aria-live ni role="status", y ningun panel llamador lo envuelve en una
    // region viva tampoco (comprobado en BadgesAdminPanel/AvatarAdminPanel).
    // Regresion vigilada: el numero de pagina cambiaba visualmente pero sin
    // region live, asi que un lector de pantalla no anunciaba nada y el usuario
    // tenia que volver a navegar hasta ese texto a mano para saber donde estaba.
    it('anuncia el cambio de pagina a lectores de pantalla', () => {
        render(<AdminPagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
        const indicador = screen.getByText(/página 2 de 5/i);
        const regionViva = indicador.closest('[aria-live], [role="status"]');
        expect(regionViva).toBeTruthy();
    });

    it('los botones de paginacion cumplen el area tactil minima', () => {
        render(<AdminPagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
        for (const boton of screen.getAllByRole('button')) {
            expect(boton.className).toMatch(/min-h-11/);
        }
    });
});
