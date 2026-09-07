import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiChoice from '@/components/quiz/MultiChoice';

// Nota: se usa fireEvent (sincrono) en vez de userEvent porque combinar
// userEvent con fake timers en esta version de la libreria produce cuelgues.

/**
 * El arreglo clave de este componente: antes un fallo solo pintaba el boton
 * de rojo, sin decir cual era la respuesta correcta. Ahora un fallo debe
 * ENSEÑAR (revela la palabra correcta y su significado) y el feedback vive en
 * una region `role="status"` con `aria-live` para que un lector de pantalla
 * lo anuncie sin que el usuario tenga que ir a buscarlo.
 */
const word = {
    id: 'w-1',
    text: 'apple',
    translation: 'manzana',
    definition: 'a round fruit',
};

const distractors = [
    { id: 'd-1', text: 'banana' },
    { id: 'd-2', text: 'grape' },
    { id: 'd-3', text: 'pear' },
    { id: 'd-4', text: 'melon' },
];

describe('MultiChoice', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('muestra las 4 opciones incluyendo la palabra correcta', () => {
        render(<MultiChoice word={word} distractors={distractors} onSuccess={() => {}} onError={() => {}} />);
        expect(screen.getByRole('button', { name: /apple/i })).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('al elegir la opcion correcta llama a onSuccess tras el retardo', async () => {
        const onSuccess = vi.fn();
        render(<MultiChoice word={word} distractors={distractors} onSuccess={onSuccess} onError={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /apple/i }));
        expect(onSuccess).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('al fallar revela la palabra correcta y su significado en el feedback', async () => {
        render(<MultiChoice word={word} distractors={distractors} onSuccess={() => {}} onError={() => {}} />);

        const incorrecta = screen.getAllByRole('button').find((b) => !/apple/i.test(b.textContent));
        fireEvent.click(incorrecta);

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/incorrecto/i);
        expect(status).toHaveTextContent('apple');
        expect(status).toHaveTextContent('manzana');
    });

    it('el feedback vive en una region role=status con aria-live', () => {
        render(<MultiChoice word={word} distractors={distractors} onSuccess={() => {}} onError={() => {}} />);
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('resalta la opcion correcta aunque el usuario haya elegido otra', async () => {
        render(<MultiChoice word={word} distractors={distractors} onSuccess={() => {}} onError={() => {}} />);

        const incorrecta = screen.getAllByRole('button').find((b) => !/apple/i.test(b.textContent));
        fireEvent.click(incorrecta);

        const correcta = screen.getByRole('button', { name: /apple/i });
        expect(correcta.className).toMatch(/bg-success/);
    });

    it('al fallar espera ~2600ms (tiempo real de lectura) antes de llamar a onError y resetear', async () => {
        const onError = vi.fn();
        render(<MultiChoice word={word} distractors={distractors} onSuccess={() => {}} onError={onError} />);

        const incorrecta = screen.getAllByRole('button').find((b) => !/apple/i.test(b.textContent));
        fireEvent.click(incorrecta);

        vi.advanceTimersByTime(800);
        expect(onError).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1800);
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it('deshabilita las opciones mientras se muestra el feedback', async () => {
        render(<MultiChoice word={word} distractors={distractors} onSuccess={() => {}} onError={() => {}} />);

        const incorrecta = screen.getAllByRole('button').find((b) => !/apple/i.test(b.textContent));
        fireEvent.click(incorrecta);

        screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
    });
});
