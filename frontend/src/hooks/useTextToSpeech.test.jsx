import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useTextToSpeech from '@/hooks/useTextToSpeech';

/**
 * La sintesis de voz se pide siempre al backend (`/game/tts/`), nunca
 * directamente a la API de ElevenLabs: la clave debe quedar en el servidor.
 * Si el backend falla o no responde, el hook cae al motor nativo del
 * navegador (`speechSynthesis`) para que el reto de escucha nunca quede
 * inutilizable. Solo cuando NINGUNA via de audio existe se marca
 * `unavailable`, señal para que la UI ofrezca la alternativa escrita.
 */
const postMock = vi.fn();

vi.mock('@/utils/useAxios', () => ({
    default: () => ({ post: postMock }),
}));

class MockAudio {
    constructor(src) {
        this.src = src;
        this.playbackRate = 1;
        this.onended = null;
        this.onerror = null;
        this.paused = false;
    }

    play() {
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
    }
}

describe('useTextToSpeech', () => {
    let speakUtteranceMock;
    let cancelMock;
    let createObjectURLMock;
    let revokeObjectURLMock;

    beforeEach(() => {
        postMock.mockReset();

        speakUtteranceMock = vi.fn();
        cancelMock = vi.fn();
        window.speechSynthesis = {
            speak: speakUtteranceMock,
            cancel: cancelMock,
            getVoices: () => [],
        };
        class MockUtterance {
            constructor(text) {
                this.text = text;
                this.lang = undefined;
                this.rate = undefined;
                this.voice = undefined;
                this.onend = null;
                this.onerror = null;
            }
        }
        window.SpeechSynthesisUtterance = vi.fn(MockUtterance);

        createObjectURLMock = vi.fn(() => 'blob:mock-url');
        revokeObjectURLMock = vi.fn();
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = revokeObjectURLMock;

        vi.stubGlobal('Audio', MockAudio);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete window.speechSynthesis;
        delete window.SpeechSynthesisUtterance;
    });

    it('pide el audio al backend en /game/tts/, nunca directamente a ElevenLabs', async () => {
        postMock.mockResolvedValue({ data: new Blob(['audio']) });
        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple', { voiceId: 'voz-1' });
        });

        expect(postMock).toHaveBeenCalledWith(
            '/game/tts/',
            expect.objectContaining({ text: 'apple', voice_id: 'voz-1' }),
            expect.objectContaining({ responseType: 'blob' }),
        );
        // Nunca se llama directamente a la API de ElevenLabs desde el cliente.
        const urlsLlamadas = postMock.mock.calls.map((c) => c[0]).join(' ');
        expect(urlsLlamadas).not.toMatch(/elevenlabs/i);
    });

    it('reproduce el audio del backend usando un object URL', async () => {
        const blob = new Blob(['audio']);
        postMock.mockResolvedValue({ data: blob });
        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple');
        });

        expect(createObjectURLMock).toHaveBeenCalledWith(blob);
        // El motor nativo no deberia usarse cuando el backend responde bien.
        expect(speakUtteranceMock).not.toHaveBeenCalled();
    });

    it('si el backend falla, cae al motor nativo del navegador (speechSynthesis)', async () => {
        postMock.mockRejectedValue(new Error('502'));
        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple', { lang: 'en-US', rate: 0.75 });
        });

        expect(cancelMock).toHaveBeenCalled();
        expect(window.SpeechSynthesisUtterance).toHaveBeenCalledWith('apple');
        expect(speakUtteranceMock).toHaveBeenCalledTimes(1);
    });

    it('marca unavailable solo cuando ni el backend ni el motor nativo estan disponibles', async () => {
        postMock.mockRejectedValue(new Error('502'));
        delete window.speechSynthesis; // ninguna via de audio

        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple');
        });

        await waitFor(() => expect(result.current.unavailable).toBe(true));
    });

    it('no marca unavailable si el motor nativo si esta disponible tras fallar el backend', async () => {
        postMock.mockRejectedValue(new Error('502'));
        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple');
        });

        expect(result.current.unavailable).toBe(false);
    });

    it('libera el object URL creado (URL.revokeObjectURL) para no filtrar memoria', async () => {
        postMock.mockResolvedValue({ data: new Blob(['audio']) });
        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple');
        });

        act(() => {
            result.current.stop();
        });

        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });

    it('libera el object URL tambien al desmontar el componente', async () => {
        postMock.mockResolvedValue({ data: new Blob(['audio']) });
        const { result, unmount } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple');
        });

        unmount();

        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });

    it('stop() cancela tanto el audio del backend como el motor nativo', async () => {
        postMock.mockResolvedValue({ data: new Blob(['audio']) });
        const { result } = renderHook(() => useTextToSpeech());

        await act(async () => {
            await result.current.speak('apple');
        });

        act(() => {
            result.current.stop();
        });

        expect(cancelMock).toHaveBeenCalled();
        expect(result.current.isPlaying).toBe(false);
    });
});
