import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import BadgeGrid from '@/components/admin/BadgeGrid';

/**
 * BadgeGrid es la vista de insignias del panel de admin. Las imagenes sin
 * `width`/`height` provocan salto de layout al cargar (mas notable en la
 * conexion movil de un aula), y el boton de borrar es solo icono: sin
 * aria-label un profesor con lector de pantalla no puede saber que insignia
 * va a borrar.
 */
const insignia = (overrides = {}) => ({
    id: 1,
    title: 'Explorador',
    description: 'Desbloquea 10 palabras',
    image: 'https://cdn.test/badge.png',
    category: 'BASIC',
    reward_data: { exp: 50 },
    unlock_condition_data: [{ type: 'WORDS_UNLOCKED', value: 10 }],
    ...overrides,
});

describe('BadgeGrid', () => {
    it('renderiza una tarjeta por insignia', () => {
        const badges = [insignia({ id: 1, title: 'Explorador' }), insignia({ id: 2, title: 'Veterano' })];
        render(<BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);

        expect(screen.getByText('Explorador')).toBeInTheDocument();
        expect(screen.getByText('Veterano')).toBeInTheDocument();
    });

    it('muestra un mensaje cuando no hay insignias', () => {
        render(<BadgeGrid badges={[]} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);
        expect(screen.getByText(/no hay insignias configuradas/i)).toBeInTheDocument();
    });

    it('la imagen de la insignia lleva carga diferida y dimensiones explicitas', () => {
        const badges = [insignia({ title: 'Explorador' })];
        render(<BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);

        const img = screen.getByRole('img', { name: 'Explorador' });
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).toHaveAttribute('width', '96');
        expect(img).toHaveAttribute('height', '96');
    });

    it('sin imagen configurada, no rompe y avisa en texto', () => {
        const badges = [insignia({ title: 'Sin imagen', image: null })];
        render(<BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText(/no image/i)).toBeInTheDocument();
    });

    it('el boton de editar es identificable por su texto visible', () => {
        const badges = [insignia({ title: 'Explorador' })];
        render(<BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);
        expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    });

    it('el boton de borrar es de solo icono y lleva aria-label con el nombre de la insignia', () => {
        const badges = [insignia({ title: 'Explorador' })];
        render(<BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);
        expect(screen.getByRole('button', { name: 'Eliminar insignia Explorador' })).toBeInTheDocument();
    });

    it('pulsar editar llama a onEdit con la insignia completa', () => {
        const onEdit = vi.fn();
        const badge = insignia({ title: 'Explorador' });
        render(<BadgeGrid badges={[badge]} loading={false} onEdit={onEdit} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /editar/i }));
        expect(onEdit).toHaveBeenCalledWith(badge);
    });

    it('pulsar borrar pide confirmacion en vez de borrar directamente', () => {
        const onDeleteRequest = vi.fn();
        const badge = insignia({ title: 'Explorador' });
        render(<BadgeGrid badges={[badge]} loading={false} onEdit={() => {}} onDeleteRequest={onDeleteRequest} currentPage={1} totalPages={1} onPageChange={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar insignia Explorador' }));
        expect(onDeleteRequest).toHaveBeenCalledWith(badge);
    });

    it('anuncia el estado de carga de forma accesible', () => {
        render(<BadgeGrid badges={[]} loading onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />);
        expect(screen.getByRole('status')).toHaveTextContent(/cargando insignias/i);
    });

    it('muestra la paginacion solo cuando hay mas de una pagina', () => {
        const badges = [insignia()];
        const { rerender } = render(
            <BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={1} onPageChange={() => {}} />,
        );
        expect(screen.queryByText(/página/i)).toBeNull();

        rerender(
            <BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={3} onPageChange={() => {}} />,
        );
        expect(screen.getByText(/página 1 de 3/i)).toBeInTheDocument();
    });

    it('cambiar de pagina delega en onPageChange', () => {
        const onPageChange = vi.fn();
        const badges = [insignia()];
        render(
            <BadgeGrid badges={badges} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} currentPage={1} totalPages={3} onPageChange={onPageChange} />,
        );

        fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });
});
