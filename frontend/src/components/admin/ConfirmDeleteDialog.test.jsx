import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/dom';
import ConfirmDeleteDialog from '@/components/admin/ConfirmDeleteDialog';

/**
 * ConfirmDeleteDialog es el unico paso entre un profesor y un borrado
 * definitivo en cinco paneles distintos (insignias, avatares, granjas,
 * diccionario, alumnos de una granja). Cada uno de esos paneles le pasa un
 * texto especifico de que se va a borrar y que se rompe con ello; estos
 * tests usan esos textos reales (tal cual aparecen en los paneles) porque el
 * riesgo no es "el dialogo se abre", es "el profesor borra algo por error
 * sin darse cuenta de lo que arrastra consigo".
 */
const props = {
    title: '¿Borrar la insignia "Explorador"?',
    description: 'Esta acción es irreversible. Los alumnos que ya la hayan ganado la conservarán en su historial, pero nadie más podrá desbloquearla.',
    confirmLabel: 'Sí, borrar esta insignia',
};

describe('ConfirmDeleteDialog', () => {
    it('se anuncia como un dialogo accesible con el titulo como nombre', () => {
        render(<ConfirmDeleteDialog open onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
        expect(screen.getByRole('dialog', { name: props.title })).toBeInTheDocument();
    });

    it('no renderiza nada cuando open es false', () => {
        render(<ConfirmDeleteDialog open={false} onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('el boton de confirmar dice QUE se borra, no un "Si, borrar" generico', () => {
        render(<ConfirmDeleteDialog open onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
        // Un boton generico obligaria al profesor a fiarse de que el dialogo
        // correcto esta abierto; el texto especifico se lo confirma sin ambiguedad.
        expect(screen.queryByRole('button', { name: 'Sí, borrar' })).toBeNull();
        expect(screen.getByRole('button', { name: /borrar esta insignia/i })).toBeInTheDocument();
    });

    it('el boton de confirmar usa la variante destructiva del sistema de diseño', () => {
        render(<ConfirmDeleteDialog open onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
        const confirmar = screen.getByRole('button', { name: /borrar esta insignia/i });
        expect(confirmar.className).toMatch(/destructive/);
    });

    it('el texto advierte del efecto en cascada sobre los alumnos', () => {
        render(<ConfirmDeleteDialog open onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
        expect(screen.getByText(/alumnos/i)).toBeInTheDocument();
        expect(screen.getByText(/irreversible/i)).toBeInTheDocument();
    });

    it('cancelar NO dispara el borrado', () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();
        render(<ConfirmDeleteDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} {...props} />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('confirmar SI dispara el borrado exactamente una vez', () => {
        const onConfirm = vi.fn();
        render(<ConfirmDeleteDialog open onOpenChange={() => {}} onConfirm={onConfirm} {...props} />);

        fireEvent.click(screen.getByRole('button', { name: /borrar esta insignia/i }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('Escape cierra el dialogo sin borrar', async () => {
        const onConfirm = vi.fn();
        const onOpenChange = vi.fn();
        render(<ConfirmDeleteDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} {...props} />);

        await userEvent.keyboard('{Escape}');

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('funciona igual con el texto real de otro panel (quitar alumno de una granja)', () => {
        // FarmDetail reutiliza el mismo componente para una accion distinta
        // (desvincular, no borrar la cuenta): el dialogo debe reflejar fielmente
        // lo que de verdad va a pasar, sin texto generico de "borrar".
        const onConfirm = vi.fn();
        render(
            <ConfirmDeleteDialog
                open
                onOpenChange={() => {}}
                onConfirm={onConfirm}
                title="¿Quitar a @ana123 de la granja?"
                description="El alumno perderá el acceso a esta granja y desaparecerá de esta tabla de desempeño. Su cuenta, su progreso y las palabras o insignias que ya haya desbloqueado no se ven afectados."
                confirmLabel="Sí, quitar a este alumno"
            />,
        );

        expect(screen.getByRole('dialog', { name: /quitar a @ana123/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /quitar a este alumno/i })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /quitar a este alumno/i }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});
