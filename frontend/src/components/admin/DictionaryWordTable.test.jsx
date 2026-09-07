import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import DictionaryWordTable from '@/components/admin/DictionaryWordTable';
import { getTypeBadgeStyle, getTypeBadgeText } from '@/lib/wordTypes';

/**
 * DictionaryWordTable es la tabla desde la que un profesor edita o borra
 * palabras del diccionario del juego. Los botones de accion son solo icono
 * (Edit/Trash2 sin texto), asi que sin aria-label son invisibles para un
 * lector de pantalla; y la tabla puede tener muchas columnas en movil, asi
 * que necesita su propio scroll horizontal en vez de desbordar la pagina.
 */
const palabra = (overrides = {}) => ({
    id: 1,
    text: 'run',
    translation: 'correr',
    definition: 'moverse rapido',
    word_type: 'SLANG',
    difficulty_level: 3,
    ...overrides,
});

describe('DictionaryWordTable', () => {
    it('renderiza una fila por palabra', () => {
        const words = [palabra({ id: 1, text: 'run' }), palabra({ id: 2, text: 'jump' })];
        render(<DictionaryWordTable words={words} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} />);

        expect(screen.getByRole('cell', { name: /run/i })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: /jump/i })).toBeInTheDocument();
        expect(screen.getAllByRole('row')).toHaveLength(3); // cabecera + 2 filas
    });

    it('muestra un mensaje cuando no hay palabras', () => {
        render(<DictionaryWordTable words={[]} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} />);
        expect(screen.getByText(/no se encontraron palabras/i)).toBeInTheDocument();
    });

    it('los botones de accion son de solo icono y llevan aria-label con la palabra', () => {
        const words = [palabra({ text: 'run' })];
        render(<DictionaryWordTable words={words} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} />);

        expect(screen.getByRole('button', { name: 'Editar la palabra run' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Eliminar la palabra run' })).toBeInTheDocument();
    });

    it('pulsar editar llama a onEdit con la palabra completa', () => {
        const onEdit = vi.fn();
        const word = palabra({ text: 'run' });
        render(<DictionaryWordTable words={[word]} loading={false} onEdit={onEdit} onDeleteRequest={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: 'Editar la palabra run' }));
        expect(onEdit).toHaveBeenCalledWith(word);
    });

    it('pulsar eliminar pide confirmacion en vez de borrar directamente', () => {
        // El componente no borra nada por si mismo: delega en onDeleteRequest,
        // que el panel usa para abrir ConfirmDeleteDialog. Si esto se saltara
        // ese paso, un click perdido borraria una palabra sin aviso.
        const onDeleteRequest = vi.fn();
        const word = palabra({ text: 'run' });
        render(<DictionaryWordTable words={[word]} loading={false} onEdit={() => {}} onDeleteRequest={onDeleteRequest} />);

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar la palabra run' }));
        expect(onDeleteRequest).toHaveBeenCalledWith(word);
    });

    it('la tabla vive dentro de un contenedor con scroll horizontal propio', () => {
        const words = [palabra()];
        render(<DictionaryWordTable words={words} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} />);

        const tabla = screen.getByRole('table');
        const contenedorScroll = tabla.closest('.overflow-x-auto');
        expect(contenedorScroll).toBeTruthy();
    });

    it('anuncia el estado de carga de forma accesible', () => {
        render(<DictionaryWordTable words={[]} loading onEdit={() => {}} onDeleteRequest={() => {}} />);
        expect(screen.getByRole('status')).toHaveTextContent(/cargando datos/i);
    });

    it('las insignias de tipo de palabra usan los mismos tokens que el resto de la app', () => {
        const words = [palabra({ id: 1, text: 'run', word_type: 'SLANG' })];
        render(<DictionaryWordTable words={words} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} />);

        const fila = screen.getByRole('cell', { name: /run/i }).closest('tr');
        const insignia = within(fila).getByText(getTypeBadgeText('SLANG'));
        // Y en castellano: al profesor no se le muestra el codigo del backend.
        expect(insignia).toHaveTextContent('JERGA');
        const clasesEsperadas = getTypeBadgeStyle('SLANG').split(' ');
        for (const clase of clasesEsperadas) {
            expect(insignia.className).toContain(clase);
        }
    });

    // Regresion vigilada: esta tabla tenia su propia copia de getTypeBadgeStyle
    // que ya divergia de @/lib/wordTypes en el caso por defecto. Ahora consume la
    // fuente unica, y este test falla si alguien vuelve a duplicarla.
    it('el caso por defecto de la insignia coincide con el de @/lib/wordTypes', () => {
        const words = [palabra({ id: 1, text: 'raro', word_type: 'TIPO_DESCONOCIDO' })];
        render(<DictionaryWordTable words={words} loading={false} onEdit={() => {}} onDeleteRequest={() => {}} />);

        const fila = screen.getByRole('cell', { name: /raro/i }).closest('tr');
        const insignia = within(fila).getByText(getTypeBadgeText('TIPO_DESCONOCIDO'));
        // Un tipo que el backend anada manana cae en el respaldo generico en
        // lugar de escupir su constante en pantalla.
        expect(insignia).not.toHaveTextContent('TIPO_DESCONOCIDO');
        const clasesEsperadas = getTypeBadgeStyle('TIPO_DESCONOCIDO').split(' ');
        for (const clase of clasesEsperadas) {
            expect(insignia.className).toContain(clase);
        }
    });
});
