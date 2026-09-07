import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';

/**
 * Los seis modales de negocio eran `<div className="fixed inset-0" onClick>`
 * planos: sin role, sin aria-modal, sin trampa de foco, sin Escape y sin
 * devolver el foco al cerrar. Se migraron a este primitivo; estos tests fijan
 * lo que el primitivo debe garantizar para todos ellos.
 */
const Sujeto = ({ onOpenChange }) => (
    <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Sugerir palabra</DialogTitle>
                <DialogDescription>Propon una palabra nueva.</DialogDescription>
            </DialogHeader>
            <button type="button">Primero</button>
            <button type="button">Segundo</button>
        </DialogContent>
    </Dialog>
);

describe('Dialog', () => {
    it('se anuncia como dialogo y es enfocable', () => {
        render(<Sujeto onOpenChange={() => {}} />);
        const dialogo = screen.getByRole('dialog');
        expect(dialogo).toHaveAttribute('role', 'dialog');
        expect(dialogo).toHaveAttribute('tabindex', '-1');
        expect(dialogo).toHaveAttribute('aria-labelledby');
    });

    it('toma su nombre accesible del titulo', () => {
        render(<Sujeto onOpenChange={() => {}} />);
        expect(screen.getByRole('dialog', { name: /sugerir palabra/i })).toBeInTheDocument();
    });

    it('cierra con Escape', async () => {
        const onOpenChange = vi.fn();
        render(<Sujeto onOpenChange={onOpenChange} />);

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it('ofrece un boton de cierre con texto para lector de pantalla', () => {
        render(<Sujeto onOpenChange={() => {}} />);
        // En español: antes decia "Close", el unico texto en ingles de la app.
        expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    });

    it('mueve el foco dentro del dialogo al abrirse', async () => {
        render(<Sujeto onOpenChange={() => {}} />);
        const dialogo = screen.getByRole('dialog');
        await waitFor(() => expect(dialogo.contains(document.activeElement)).toBe(true));
    });

    it('aisla el fondo: el contenido de detras queda oculto para lectores de pantalla', () => {
        render(
            <>
                <button type="button">Fuera del dialogo</button>
                <Sujeto onOpenChange={() => {}} />
            </>,
        );
        // Radix no pone aria-modal (tiene errores conocidos en varios lectores):
        // marca aria-hidden en los hermanos, que es mas fiable. El efecto para el
        // usuario es el mismo y comprobable: el boton del fondo ya no es
        // alcanzable por rol, porque esta fuera del arbol de accesibilidad.
        expect(screen.queryByRole('button', { name: 'Fuera del dialogo' })).toBeNull();
        const botonFondo = [...document.body.querySelectorAll('button')]
            .find((b) => b.textContent === 'Fuera del dialogo');
        expect(botonFondo).toBeTruthy();
        expect(botonFondo.closest('[aria-hidden="true"]')).toBeTruthy();
    });

    it('atrapa el foco: tabular no sale del dialogo', async () => {
        render(<Sujeto onOpenChange={() => {}} />);
        const dialogo = screen.getByRole('dialog');

        for (let i = 0; i < 6; i += 1) {
            await userEvent.tab();
            expect(dialogo.contains(document.activeElement)).toBe(true);
        }
    });

    it('permite scroll interno para que el contenido largo no se salga', () => {
        render(<Sujeto onOpenChange={() => {}} />);
        const contenido = screen.getByRole('dialog');
        expect(contenido.className).toMatch(/overflow-y-auto/);
        // dvh y no vh: en movil la barra del navegador entra en el calculo.
        expect(contenido.className).toMatch(/overlay-max-h/);
    });
});
