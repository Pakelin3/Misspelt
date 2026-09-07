import { useState, useEffect, useRef, useCallback } from 'react';
import { PixelVolume3Icon, PixelMicIcon } from '@/components/PixelIcons';
import useAxios from '@/utils/useAxios';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { Button } from '@/components/ui/Button';

const LISTENING_VOICE_ID = "IKne3meq5aSn9XLyUdCD";

const ListeningChallenge = ({ word, onSuccess, onError }) => {
    const [{ inputValue, feedback, isRecording, isProcessingSTT, errorMessage, showTranscript }, setState] = useState({
        inputValue: "",
        feedback: null,
        isRecording: false,
        isProcessingSTT: false,
        errorMessage: null,
        showTranscript: false,
    });

    const api = useAxios();
    const { speak, stop, isPlaying, unavailable } = useTextToSpeech();

    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            inputValue: "",
            feedback: null,
            errorMessage: null,
            showTranscript: false,
        }));
        const timer = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
    }, [word]);

    // Al desmontar o cambiar de palabra, cortar cualquier audio en curso.
    useEffect(() => stop, [stop, word]);

    const playAudio = () => {
        if (isPlaying) return;
        setState((prev) => ({ ...prev, errorMessage: null }));
        speak(word.text, { rate: 0.75, lang: 'en-US', voiceId: LISTENING_VOICE_ID });
    };

    const checkAnswer = useCallback((e, forcedInput = null) => {
        if (e && e.preventDefault) e.preventDefault();

        setState((prev) => {
            if (prev.feedback) return prev;

            const inputToCheck = forcedInput !== null ? forcedInput : prev.inputValue;
            const cleanInput = inputToCheck.trim().toLowerCase();
            const cleanTarget = word.text.trim().toLowerCase();
            const isSynonym = word.substitutes?.some((s) => s.toLowerCase() === cleanInput);

            if (cleanInput === cleanTarget || isSynonym) {
                setTimeout(onSuccess, 1000);
                return { ...prev, feedback: 'correct', inputValue: inputToCheck, errorMessage: null };
            }

            // Un fallo debe enseñar: se revela la palabra correcta antes de avanzar.
            setTimeout(() => {
                setState((current) => ({ ...current, feedback: null }));
                onError();
            }, 2600);
            return { ...prev, feedback: 'wrong', inputValue: inputToCheck, errorMessage: null };
        });
    }, [onError, onSuccess, word]);

    const transcribeRecording = useCallback(async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const { data } = await api.post('/game/stt/', formData);

            const cleaned = (data.text || '')
                .replace(/\s*\[.*?\]\s*|\s*\(.*?\)\s*/g, ' ')
                .replace(/[.,!?]/g, '')
                .trim();

            setState((prev) => ({ ...prev, inputValue: cleaned, isProcessingSTT: false }));
            setTimeout(() => checkAnswer(null, cleaned), 100);
        } catch {
            setState((prev) => ({
                ...prev,
                isProcessingSTT: false,
                errorMessage: 'No pudimos entender el audio. Intenta grabar de nuevo en un lugar silencioso.',
            }));
        }
    }, [api, checkAnswer]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach((track) => track.stop());
                await transcribeRecording(audioBlob);
            };

            mediaRecorder.start();
            setState((prev) => ({ ...prev, isRecording: true, errorMessage: null }));
        } catch {
            setState((prev) => ({
                ...prev,
                errorMessage: 'No pudimos usar el micrófono. Revisa los permisos del navegador o escribe tu respuesta.',
            }));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setState((prev) => ({ ...prev, isRecording: false, isProcessingSTT: true }));
        }
    };

    const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

    const inputDisabled = feedback === 'correct' || isProcessingSTT || isRecording;

    return (
        <div className="flex flex-col items-center space-y-8 w-full">
            <div className="text-center space-y-4 bg-muted p-8 border-4 border-primary pixel-border shadow-pixel-md-primary w-full">
                <h3 className="text-xl font-mono text-primary uppercase tracking-widest mb-2">Escucha y Responde</h3>

                <div className="flex justify-center gap-6">
                    {/* Botón de Escuchar */}
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={playAudio}
                            disabled={isProcessingSTT || isRecording}
                            aria-label={`Escuchar la palabra${isPlaying ? ' (reproduciendo)' : ''}`}
                            className={`
                                w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border-4 transition-all pixel-btn
                                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${isPlaying
                                    ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-none translate-y-[4px]'
                                    : 'bg-background text-primary border-primary hover:scale-105 shadow-pixel-md'
                                }
                                ${(isProcessingSTT || isRecording) ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                            `}
                        >
                            <PixelVolume3Icon aria-hidden="true" className={`w-9 h-9 ${isPlaying ? 'motion-safe:animate-pulse' : ''}`} />
                        </button>
                        <p className="text-2xs md:text-sm font-mono text-muted-foreground mt-4 uppercase">Escuchar</p>
                    </div>

                    {/* Botón de Hablar (STT) */}
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={toggleRecording}
                            disabled={isPlaying || isProcessingSTT}
                            aria-pressed={isRecording}
                            aria-label={isRecording ? 'Detener la grabación' : 'Responder hablando'}
                            className={`
                                w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border-4 transition-all pixel-btn
                                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${isRecording
                                    ? 'bg-destructive text-destructive-foreground border-destructive motion-safe:animate-pulse translate-y-[2px]'
                                    : 'bg-background text-destructive border-destructive hover:scale-105 shadow-pixel-md'
                                }
                                ${(isPlaying || isProcessingSTT) ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                            `}
                        >
                            <PixelMicIcon aria-hidden="true" className="w-9 h-9" />
                        </button>
                        <p className="text-2xs md:text-sm font-mono text-muted-foreground mt-4 uppercase">
                            {isRecording ? "Grabando..." : "Responder Hablando"}
                        </p>
                    </div>
                </div>

                {/* Alternativa no auditiva: el reto sigue siendo un reto para quien
                    sí oye, pero deja de ser un muro para quien no. */}
                <div className="pt-2">
                    {showTranscript ? (
                        <p className="font-sans text-lg text-foreground" aria-live="polite">
                            La palabra escrita es <strong lang="en">{word.text}</strong>
                        </p>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setState((prev) => ({ ...prev, showTranscript: true }))}
                            className="inline-flex min-h-11 items-center px-2 font-sans text-base text-muted-foreground underline decoration-2 underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            ¿No puedes escuchar? Ver la palabra escrita
                        </button>
                    )}
                </div>

                {unavailable && (
                    <p role="alert" className="font-sans text-base text-destructive">
                        Tu navegador no puede reproducir audio. Usa la palabra escrita para continuar.
                    </p>
                )}
            </div>

            <form onSubmit={checkAnswer} className="w-full relative group">
                <label htmlFor="listening-answer" className="sr-only">
                    Escribe la palabra que escuchas
                </label>
                <input
                    id="listening-answer"
                    ref={inputRef}
                    type="text"
                    value={isProcessingSTT ? "Traduciendo voz..." : inputValue}
                    onChange={(e) => setState((prev) => ({ ...prev, inputValue: e.target.value }))}
                    disabled={inputDisabled}
                    placeholder="Escribe lo que escuchas..."
                    autoCapitalize="off"
                    autoComplete="off"
                    spellCheck="false"
                    autoCorrect="off"
                    lang="en"
                    aria-invalid={feedback === 'wrong'}
                    aria-describedby="listening-feedback"
                    className={`
                        w-full p-5 pl-16 text-xl md:text-2xl font-bold font-sans text-center border-4 transition-all pixel-border
                        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
                        ${feedback === 'correct' ? 'border-success bg-success/10 text-success' : ''}
                        ${feedback === 'wrong' ? 'border-destructive bg-destructive/10 text-destructive' : ''}
                        ${!feedback ? 'border-primary bg-background text-foreground shadow-pixel-md-primary' : ''}
                    `}
                />
                <PixelMicIcon
                    aria-hidden="true"
                    className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors w-7 h-7 ${!feedback ? 'text-primary' : feedback === 'correct' ? 'text-success' : 'text-destructive'}`}
                />
            </form>

            <div id="listening-feedback" role="status" aria-live="polite" className="min-h-16 flex items-center justify-center text-center">
                {feedback === 'wrong' && (
                    <p className="text-destructive font-sans text-lg">
                        Casi. La palabra era <strong lang="en">{word.text}</strong>
                        {word.translation ? <> — «{word.translation}»</> : null}. Escúchala otra vez.
                    </p>
                )}
                {feedback === 'correct' && (
                    <p className="text-success font-sans text-lg">¡Correcto!</p>
                )}
                {errorMessage && !feedback && (
                    <p role="alert" className="text-destructive font-sans text-lg">{errorMessage}</p>
                )}
            </div>

            <Button
                variant="accent"
                onClick={checkAnswer}
                disabled={!inputValue || Boolean(feedback)}
                className="w-full md:w-auto px-10 py-4 text-xl md:text-xl font-black"
            >
                COMPROBAR
            </Button>
        </div>
    );
};

export default ListeningChallenge;
