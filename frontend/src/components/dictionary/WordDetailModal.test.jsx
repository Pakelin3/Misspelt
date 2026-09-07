import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WordDetailModal from '@/components/dictionary/WordDetailModal';

/**
 * Modal de detalle de palabra del diccionario: debe ser un dialogo accesible
 * (nombrado por la propia palabra), permitir navegar entre varios ejemplos de
 * uso anunciando la posicion ("1/2") para quien usa lector de pantalla, y
 * marcar el texto en ingles con `lang="en"` para que la sintesis de voz y los
 * lectores de pantalla lo pronuncien correctamente. El boton de pronunciacion
 * usa el hook compartido `useTextToSpeech`, que aqui se mockea.
 */
const speakMock = vi.fn();

vi.mock('@/hooks/useTextToSpeech', () => ({
    default: () => ({ speak: speakMock, isPlaying: false }),
}));

vi.mock('@/utils/useAxios', () => ({
    default: () => ({ get: vi.fn(), post: vi.fn() }),
}));

const wordConUnEjemplo = {
    id: 1,
    text: 'apple',
    definition: 'a round fruit',
    word_type: 'VOCABULARY',
    examples: ['I ate an apple.'],
};

const wordConDosEjemplos = {
    id: 2,
    text: 'run',
    definition: 'to move fast on foot',
    word_type: 'VOCABULARY',
    examples: [
        { en: 'I run every morning.', es: 'Corro todas las mañanas.' },
        { en: 'She runs a company.', es: 'Ella dirige una empresa.' },
    ],
};

describe('WordDetailModal', () => {
    beforeEach(() => {
        speakMock.mockClear();
    });

    it('es un dialogo accesible cuyo nombre es la palabra', () => {
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(screen.getByRole('dialog', { name: /apple/i })).toBeInTheDocument();
    });

    it('no renderiza nada si no hay palabra', () => {
        const { container } = render(<WordDetailModal word={null} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('muestra la definicion de la palabra', () => {
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(screen.getByText('a round fruit')).toBeInTheDocument();
    });

    it('con un solo ejemplo no muestra controles de navegacion', () => {
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(screen.queryByRole('button', { name: /ejemplo siguiente/i })).not.toBeInTheDocument();
    });

    it('sin ejemplos, avisa de que la palabra aun no tiene ejemplos', () => {
        render(<WordDetailModal word={{ ...wordConUnEjemplo, examples: [] }} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(screen.getByText(/todavía no tiene ejemplos/i)).toBeInTheDocument();
    });

    it('el texto en ingles de un ejemplo simple lleva lang="en"', () => {
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={() => {}} />);
        const texto = screen.getByText('I ate an apple.');
        expect(texto).toHaveAttribute('lang', 'en');
    });

    it('con varios ejemplos anuncia la posicion "1/2" al abrir', () => {
        render(<WordDetailModal word={wordConDosEjemplos} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(screen.getByText('1/2')).toBeInTheDocument();
        expect(screen.getByText('I run every morning.')).toHaveAttribute('lang', 'en');
        expect(screen.getByText('Corro todas las mañanas.')).not.toHaveAttribute('lang');
    });

    it('el boton "ejemplo siguiente" avanza y anuncia "2/2"', () => {
        render(<WordDetailModal word={wordConDosEjemplos} onClose={() => {}} onOpenOracle={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /ejemplo siguiente/i }));

        expect(screen.getByText('2/2')).toBeInTheDocument();
        expect(screen.getByText('She runs a company.')).toBeInTheDocument();
    });

    it('el boton "ejemplo siguiente" da la vuelta de 2/2 a 1/2', () => {
        render(<WordDetailModal word={wordConDosEjemplos} onClose={() => {}} onOpenOracle={() => {}} />);

        const siguiente = screen.getByRole('button', { name: /ejemplo siguiente/i });
        fireEvent.click(siguiente);
        fireEvent.click(siguiente);

        expect(screen.getByText('1/2')).toBeInTheDocument();
        expect(screen.getByText('I run every morning.')).toBeInTheDocument();
    });

    it('el boton "ejemplo anterior" retrocede y da la vuelta de 1/2 a 2/2', () => {
        render(<WordDetailModal word={wordConDosEjemplos} onClose={() => {}} onOpenOracle={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /ejemplo anterior/i }));

        expect(screen.getByText('2/2')).toBeInTheDocument();
        expect(screen.getByText('She runs a company.')).toBeInTheDocument();
    });

    it('el boton de pronunciacion tiene un aria-label que incluye la palabra', () => {
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={() => {}} />);
        expect(screen.getByRole('button', { name: /pronunciación de apple/i })).toBeInTheDocument();
    });

    it('al pulsar el boton de pronunciacion, llama a speak con la palabra', () => {
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={() => {}} />);
        fireEvent.click(screen.getByRole('button', { name: /pronunciación de apple/i }));

        expect(speakMock).toHaveBeenCalledWith('apple', expect.objectContaining({ lang: 'en-US' }));
    });

    it('el boton "Consultar al Oráculo" llama a onOpenOracle', () => {
        const onOpenOracle = vi.fn();
        render(<WordDetailModal word={wordConUnEjemplo} onClose={() => {}} onOpenOracle={onOpenOracle} />);

        fireEvent.click(screen.getByRole('button', { name: /consultar al oráculo/i }));

        expect(onOpenOracle).toHaveBeenCalledTimes(1);
    });

    it('cerrar el dialogo (Escape) llama a onClose', () => {
        const onClose = vi.fn();
        render(<WordDetailModal word={wordConUnEjemplo} onClose={onClose} onOpenOracle={() => {}} />);

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
