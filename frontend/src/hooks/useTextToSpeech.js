import { useCallback, useEffect, useRef, useState } from 'react';
import useAxios from '@/utils/useAxios';

/**
 * Sintesis de voz centralizada.
 *
 * El audio se pide al backend (`/game/tts/`), que es quien conoce la clave de
 * ElevenLabs. Si ese servicio falla o no esta configurado, cae al motor nativo
 * del navegador, de forma que el reto de escucha nunca queda inutilizable.
 *
 * Devuelve `unavailable: true` solo cuando no hay ninguna via de audio, para que
 * la UI pueda ofrecer la alternativa escrita en lugar de dejar al usuario atascado.
 */
const useTextToSpeech = () => {
    const api = useAxios();
    const [isPlaying, setIsPlaying] = useState(false);
    const [unavailable, setUnavailable] = useState(false);

    const audioRef = useRef(null);
    const objectUrlRef = useRef(null);
    const isMountedRef = useRef(true);

    const releaseAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        releaseAudio();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (isMountedRef.current) setIsPlaying(false);
    }, [releaseAudio]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            releaseAudio();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [releaseAudio]);

    const speakNatively = useCallback((text, { rate, lang }) => {
        if (!('speechSynthesis' in window)) {
            setUnavailable(true);
            if (isMountedRef.current) setIsPlaying(false);
            return false;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
        if (preferred) utterance.voice = preferred;

        const finish = () => {
            if (isMountedRef.current) setIsPlaying(false);
        };
        utterance.onend = finish;
        utterance.onerror = finish;

        window.speechSynthesis.speak(utterance);
        return true;
    }, []);

    const speak = useCallback(async (text, options = {}) => {
        const { rate = 1, lang = 'en-US', voiceId } = options;
        const trimmed = (text || '').trim();
        if (!trimmed) return;

        stop();
        if (isMountedRef.current) setIsPlaying(true);

        try {
            const { data } = await api.post(
                '/game/tts/',
                voiceId ? { text: trimmed, voice_id: voiceId } : { text: trimmed },
                { responseType: 'blob' },
            );

            if (!isMountedRef.current) return;

            const url = URL.createObjectURL(data);
            objectUrlRef.current = url;

            const audio = new Audio(url);
            audio.playbackRate = rate;
            audioRef.current = audio;

            audio.onended = () => {
                releaseAudio();
                if (isMountedRef.current) setIsPlaying(false);
            };
            audio.onerror = () => {
                releaseAudio();
                speakNatively(trimmed, { rate, lang });
            };

            await audio.play();
        } catch {
            // El proxy no respondio: el motor del navegador es la red de seguridad.
            if (isMountedRef.current) speakNatively(trimmed, { rate, lang });
        }
    }, [api, releaseAudio, speakNatively, stop]);

    return { speak, stop, isPlaying, unavailable };
};

export default useTextToSpeech;
