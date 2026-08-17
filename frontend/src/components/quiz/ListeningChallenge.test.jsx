import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ListeningChallenge from '@/components/quiz/ListeningChallenge';

/**
 * Arreglo critico: antes este reto no tenia NINGUNA via para un usuario sordo
 * (solo boton de escuchar + input). Ahora existe una alternativa no auditiva
 * ("Ver la palabra escrita") que desbloquea el reto para quien no puede oir
 * el audio. Tambien se elimino el uso de alert() (dos llamadas antes), que
 * bloquea el hilo y es inaccesible para lectores de pantalla.
 *
 * Se mockean useTextToSpeech y useAxios para no tocar red ni requerir
 * AuthContext real.
 */
const speakMock = vi.fn();
const stopMock = vi.fn();
let ttsState = { speak: speakMock, stop: stopMock, isPlaying: false, unavailable: false };

vi.mock('@/hooks/useTextToSpeech', () => ({
    default: () => ttsState,
}));

vi.mock('@/utils/useAxios', () => ({
    default: () => ({ post: vi.fn().mockResolvedValue({ data: { text: '' } }) }),
}));

const word = {
    id: 'w-1',
    text: 'apple',
    translation: 'manzana',
    substitutes: ['fruit'],
};

describe('ListeningChallenge', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        speakMock.mockClear();
        stopMock.mockClear();
        ttsState = { speak: speakMock, stop: stopMock, isPlaying: false, unavailable: false };
        window.alert = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('el input tiene un label asociado (aunque sea sr-only)', () => {
        render(<ListeningChallenge word={word} onSuccess={() => {}} onError={() => {}} />);
        expect(screen.getByLabelText(/escribe la palabra que escuchas/i)).toBeInTheDocument();
    });

    it('ofrece un control "¿No puedes escuchar? Ver la palabra escrita" que revela word.text', async () => {
        render(<ListeningChallenge word={word} onSuccess={() => {}} onError={() => {}} />);

        expect(screen.queryByText(/la palabra escrita es/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /no puedes escuchar/i }));

        expect(screen.getByText(/la palabra escrita es/i)).toBeInTheDocument();
        expect(screen.getByText('apple')).toBeInTheDocument();
    });

    it('al acertar llama a onSuccess', async () => {
        const onSuccess = vi.fn();
        render(<ListeningChallenge word={word} onSuccess={onSuccess} onError={() => {}} />);

        fireEvent.change(screen.getByLabelText(/escribe la palabra que escuchas/i), { target: { value: 'apple' } });
        fireEvent.click(screen.getByRole('button', { name: /^comprobar$/i }));

        expect(screen.getByRole('status')).toHaveTextContent(/correcto/i);
        vi.advanceTimersByTime(1000);
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('acepta un sustituto (substitutes) como respuesta valida', async () => {
        const onSuccess = vi.fn();
        render(<ListeningChallenge word={word} onSuccess={onSuccess} onError={() => {}} />);

        fireEvent.change(screen.getByLabelText(/escribe la palabra que escuchas/i), { target: { value: 'fruit' } });
        fireEvent.click(screen.getByRole('button', { name: /^comprobar$/i }));

        vi.advanceTimersByTime(1000);
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('al fallar revela la palabra correcta y su traduccion, y llama a onError tras el retardo', async () => {
        const onError = vi.fn();
        render(<ListeningChallenge word={word} onSuccess={() => {}} onError={onError} />);

        fireEvent.change(screen.getByLabelText(/escribe la palabra que escuchas/i), { target: { value: 'banana' } });
        fireEvent.click(screen.getByRole('button', { name: /^comprobar$/i }));

        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/la palabra era/i);
        expect(status).toHaveTextContent('apple');
        expect(status).toHaveTextContent('manzana');

        expect(onError).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2600);
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it('NO usa window.alert en ningun momento (antes habia dos llamadas)', async () => {
        render(<ListeningChallenge word={word} onSuccess={() => {}} onError={() => {}} />);

        fireEvent.change(screen.getByLabelText(/escribe la palabra que escuchas/i), { target: { value: 'banana' } });
        fireEvent.click(screen.getByRole('button', { name: /^comprobar$/i }));
        vi.advanceTimersByTime(2600);

        expect(window.alert).not.toHaveBeenCalled();
    });

    it('cuando el audio no esta disponible (unavailable) lo anuncia con role=alert', () => {
        ttsState = { speak: speakMock, stop: stopMock, isPlaying: false, unavailable: true };
        render(<ListeningChallenge word={word} onSuccess={() => {}} onError={() => {}} />);
        expect(screen.getByRole('alert')).toHaveTextContent(/no puede reproducir audio/i);
    });
});
