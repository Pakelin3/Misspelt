import { useState, useEffect, useRef } from 'react';
import { Volume2, Mic } from 'lucide-react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const ListeningChallenge = ({ word, onSuccess, onError }) => {
    const [{ inputValue, isPlaying, feedback, voices, isRecording, isProcessingSTT }, setState] = useState({
        inputValue: "",
        isPlaying: false,
        feedback: null,
        voices: [],
        isRecording: false,
        isProcessingSTT: false
    });
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        setState(prev => ({ ...prev, inputValue: "", feedback: null }));
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [word]);

    useEffect(() => {
        const updateVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setState(prev => ({ ...prev, voices: availableVoices }));
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const playAudio = async () => {
        if (isPlaying) return;
        setState(prev => ({ ...prev, isPlaying: true }));
        console.log("🔊 Solicitando audio a IA (ElevenLabs SDK):", word.text);

        try {
            const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            if (!apiKey) throw new Error("API Key no encontrada");

            const elevenlabs = new ElevenLabsClient({ apiKey });
            const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel

            const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
                text: word.text,
                model_id: "eleven_multilingual_v2",
                output_format: "mp3_44100_128",
            });

            const chunks = [];
            for await (const chunk of audioStream) {
                chunks.push(chunk);
            }
            const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.playbackRate = 0.55;

            audio.onplay = () => console.log("▶️ Reproduciendo IA de ElevenLabs SDK...");
            audio.onended = () => {
                console.log("⏹️ Audio finalizado.");
                setState(prev => ({ ...prev, isPlaying: false }));
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();

        } catch (error) {
            console.error("❌ Error en ElevenLabs TTS, activando Plan B (Nativo):", error);

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(word.text);
                utterance.lang = 'en-US';
                utterance.rate = 0.85;

                const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
                const englishVoice = availableVoices.find(v => v.lang === 'en-US') || availableVoices.find(v => v.lang.includes('en'));
                if (englishVoice) utterance.voice = englishVoice;

                window.currentUtterance = utterance;
                utterance.onend = () => {
                    setState(prev => ({ ...prev, isPlaying: false }));
                    delete window.currentUtterance;
                };

                window.speechSynthesis.speak(utterance);
            } else {
                setState(prev => ({ ...prev, isPlaying: false }));
                alert("Tu navegador no soporta audio :(");
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
                await processAudioWithElevenLabs(audioBlob);

                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setState(prev => ({ ...prev, isRecording: true }));
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("No se pudo acceder al micrófono. Por favor, revisa los permisos.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setState(prev => ({ ...prev, isRecording: false, isProcessingSTT: true }));
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const processAudioWithElevenLabs = async (audioBlob) => {
        try {
            const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            if (!apiKey) throw new Error("API Key no encontrada");

            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.mp3');
            formData.append('model_id', 'scribe_v1');

            console.log("🎙️ Enviando audio a ElevenLabs STT...");

            const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail?.message || "Error en la transcripción");
            }

            const data = await response.json();
            const transcribedText = data.text || "";

            console.log("📝 Texto transcrito:", transcribedText);
            let cleanTranscription = transcribedText.replace(/\s*\[.*?\]\s*|\s*\(.*?\)\s*/g, ' ');
            cleanTranscription = cleanTranscription.replace(/[.,!?]/g, '').trim();

            setState(prev => ({ ...prev, inputValue: cleanTranscription, isProcessingSTT: false }));

            setTimeout(() => {
                const formEvent = new Event('submit', { bubbles: true, cancelable: true });
                checkAnswer(formEvent, cleanTranscription);
            }, 100);

        } catch (error) {
            console.error("❌ Error en ElevenLabs STT:", error);
            alert("Error al transcribir el audio: " + error.message);
            setState(prev => ({ ...prev, isProcessingSTT: false }));
        }
    };

    const checkAnswer = (e, forcedInput = null) => {
        if (e && e.preventDefault) e.preventDefault();
        if (feedback) return;

        const inputToCheck = forcedInput !== null ? forcedInput : inputValue;
        const cleanInput = inputToCheck.trim().toLowerCase();
        const cleanTarget = word.text.trim().toLowerCase();

        const isSynonym = word.substitutes && word.substitutes.some(s => s.toLowerCase() === cleanInput);

        if (cleanInput === cleanTarget || isSynonym) {
            setState(prev => ({ ...prev, feedback: 'correct', inputValue: inputToCheck }));
            setTimeout(onSuccess, 1000);
        } else {
            setState(prev => ({ ...prev, feedback: 'wrong', inputValue: inputToCheck }));
            setTimeout(() => {
                setState(prev => ({ ...prev, feedback: null }));
                onError();
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full">
            <div className="text-center space-y-4 bg-muted p-8 border-4 border-primary pixel-border shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)] w-full">
                <h3 className="text-xl font-pixel text-primary uppercase tracking-widest mb-2">Escucha y Responde</h3>

                <div className="flex justify-center gap-6">
                    {/* Botón de Escuchar */}
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={playAudio}
                            disabled={isProcessingSTT || isRecording}
                            className={`
                    w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border-4 transition-all pixel-btn
                    ${isPlaying
                                    ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-none translate-y-[4px]'
                                    : 'bg-background text-primary border-primary hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                }
                    ${(isProcessingSTT || isRecording) ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                `}
                        >
                            <Volume2 size={36} className={isPlaying ? 'animate-pulse' : ''} />
                        </button>
                        <p className="text-[10px] md:text-sm font-pixel text-muted-foreground mt-4 uppercase">Escuchar</p>
                    </div>

                    {/* Botón de Hablar (STT) */}
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={toggleRecording}
                            disabled={isPlaying || isProcessingSTT}
                            className={`
                    w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border-4 transition-all pixel-btn
                    ${isRecording
                                    ? 'bg-destructive text-destructive-foreground border-destructive animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)] translate-y-[2px]'
                                    : 'bg-background text-destructive border-destructive hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                }
                    ${(isPlaying || isProcessingSTT) ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                `}
                        >
                            <Mic size={36} />
                        </button>
                        <p className="text-[10px] md:text-sm font-pixel text-muted-foreground mt-4 uppercase">
                            {isRecording ? "Grabando..." : "Responder Hablando"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={(e) => checkAnswer(e)} className="w-full relative group">
                <input
                    ref={inputRef}
                    type="text"
                    value={isProcessingSTT ? "Traduciendo voz..." : inputValue}
                    onChange={(e) => setState(prev => ({ ...prev, inputValue: e.target.value }))}
                    disabled={feedback === 'correct' || isProcessingSTT || isRecording}
                    placeholder="Escribe lo que escuchas..."
                    autoCapitalize="off"
                    autoComplete="off"
                    spellCheck="false"
                    autoCorrect="off"
                    className={`
            w-full p-5 pl-16 text-xl md:text-2xl font-bold font-sans text-center border-4 outline-none transition-all pixel-border
            ${feedback === 'correct' ? 'border-green-500 bg-green-500/10 text-green-500' : ''}
            ${feedback === 'wrong' ? 'border-destructive bg-destructive/10 text-destructive' : ''}
            ${!feedback ? 'border-primary bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)]' : ''}
          `}
                />
                <Mic className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${!feedback ? 'text-primary' : feedback === 'correct' ? 'text-green-500' : 'text-destructive'}`} size={28} />
            </form>

            <div className="h-8 flex items-center justify-center">
                {feedback === 'wrong' && (
                    <p className="text-destructive font-pixel text-sm animate-bounce">❌ ¡Ups! Inténtalo de nuevo.</p>
                )}
            </div>

            <button
                onClick={checkAnswer}
                disabled={!inputValue || feedback}
                className="w-full md:w-auto bg-accent px-10 py-4 font-black text-xl uppercase pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all 
                disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
                COMPROBAR
            </button>
        </div>
    );
};

export default ListeningChallenge;