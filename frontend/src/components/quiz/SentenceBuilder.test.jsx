import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SentenceBuilder from '@/components/quiz/SentenceBuilder';

/**
 * Arreglo clave: antes un fallo solo mostraba "INCORRECTO" sin decir cual era
 * el orden correcto de la frase. Ademas, al usar @dnd-kit el reordenamiento
 * debe ser accesible por teclado (instrucciones para lector de pantalla y
 * nombre accesible con la posicion de cada palabra), no solo con raton/touch.
 *
 * El componente baraja las palabras con Fisher-Yates usando Math.random().
 * En vez de reintentar renders hasta que el azar coopere, se fija Math.random
 * para que el barajado sea determinista: un valor cercano a 1 hace floor(r*(i+1))
 * === i en cada paso (ningun swap, queda el orden original = correcto); un
 * valor de 0 hace floor(r*(i+1)) === 0 siempre (barajado completo = incorrecto
 * para una frase de mas de una palabra).
 */
const word = {
    id: 'w-1',
    text: 'apple',
    examples: [{ en: 'I eat an apple', es: 'Yo como una manzana' }],
};

describe('SentenceBuilder', () => {
    let randomSpy;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        randomSpy?.mockRestore();
    });

    it('renderiza una palabra arrastrable por cada palabra de la frase objetivo', () => {
        render(<SentenceBuilder word={word} direction="en" onSuccess={() => {}} onError={() => {}} />);
        // "I eat an apple" -> 4 palabras
        expect(screen.getAllByRole('button', { name: /posición \d de 4/i })).toHaveLength(4);
    });

    it('cada palabra arrastrable tiene un nombre accesible que incluye su posicion', () => {
        render(<SentenceBuilder word={word} direction="en" onSuccess={() => {}} onError={() => {}} />);
        for (let pos = 1; pos <= 4; pos += 1) {
            expect(screen.getByRole('button', { name: new RegExp(`posición ${pos} de 4`, 'i') })).toBeInTheDocument();
        }
    });

    it('ofrece instrucciones de teclado accesibles para reordenar (dnd-kit screenReaderInstructions)', () => {
        render(<SentenceBuilder word={word} direction="en" onSuccess={() => {}} onError={() => {}} />);
        expect(screen.getByText(/presiona espacio para tomar la palabra/i)).toBeInTheDocument();
    });

    it('no usa animate-bounce en ningun elemento', () => {
        const { container } = render(
            <SentenceBuilder word={word} direction="en" onSuccess={() => {}} onError={() => {}} />,
        );
        expect(container.innerHTML).not.toMatch(/animate-bounce/);
    });

    it('al fallar revela el orden correcto de la frase', async () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // fuerza barajado != orden correcto
        const onError = vi.fn();

        render(<SentenceBuilder word={word} direction="en" onSuccess={() => {}} onError={onError} />);
        fireEvent.click(screen.getByRole('button', { name: /comprobar/i }));

        // dnd-kit añade su propia región role="status" (viva pero vacía) para
        // anunciar movimientos de arrastre; la nuestra es la que trae el texto.
        const status = screen.getAllByRole('status').find((el) => el.textContent.trim() !== '');
        expect(status).toHaveTextContent(/incorrecto/i);
        expect(status).toHaveTextContent(/el orden correcto era/i);
        expect(status.textContent.toLowerCase()).toContain('apple');

        vi.advanceTimersByTime(2600);
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it('al acertar llama a onSuccess', async () => {
        randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.999); // sin swaps: queda el orden original correcto
        const onSuccess = vi.fn();

        render(<SentenceBuilder word={word} direction="en" onSuccess={onSuccess} onError={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /comprobar/i }));

        const status = screen.getAllByRole('status').find((el) => el.textContent.trim() !== '');
        expect(status).toHaveTextContent(/excelente/i);

        vi.advanceTimersByTime(1500);
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });
});
