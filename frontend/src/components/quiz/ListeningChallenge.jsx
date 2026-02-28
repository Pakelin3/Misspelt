import { useState, useEffect, useRef } from 'react';
import { Volume2, Mic } from 'lucide-react';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const ListeningChallenge = ({ word, onSuccess, onError }) => {
    const [inputValue, setInputValue] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [voices, setVoices] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        setInputValue("");
        setFeedback(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [word]);

    useEffect(() => {
        const updateVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const playAudio = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
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
                setIsPlaying(false);
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
                    setIsPlaying(false);
                    delete window.currentUtterance;
                };

                window.speechSynthesis.speak(utterance);
            } else {
                setIsPlaying(false);
                alert("Tu navegador no soporta audio :(");
            }
        }
    };

    const checkAnswer = (e) => {
        e.preventDefault();
        if (feedback) return;

        const cleanInput = inputValue.trim().toLowerCase();
        const cleanTarget = word.text.trim().toLowerCase();

        const isSynonym = word.substitutes && word.substitutes.some(s => s.toLowerCase() === cleanInput);

        if (cleanInput === cleanTarget || isSynonym) {
            setFeedback('correct');
            setTimeout(onSuccess, 1000);
        } else {
            setFeedback('wrong');
            setTimeout(() => {
                setFeedback(null);
                onError();
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full">
            <div className="text-center space-y-4 bg-muted p-8 border-4 border-primary pixel-border shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)] w-full">
                <h3 className="text-xl font-pixel text-primary uppercase tracking-widest mb-2">Escucha y Escribe</h3>

                <button
                    onClick={playAudio}
                    className={`
            mx-auto w-24 h-24 flex items-center justify-center border-4 transition-all pixel-btn
            ${isPlaying
                            ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-none translate-y-[4px]'
                            : 'bg-background text-primary border-primary hover:scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                        }
          `}
                >
                    <Volume2 size={40} className={isPlaying ? 'animate-pulse' : ''} />
                </button>
                <p className="text-sm font-pixel text-muted-foreground mt-4 uppercase">Click para escuchar</p>
            </div>

            <form onSubmit={checkAnswer} className="w-full relative group">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={feedback === 'correct'}
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
                className="w-full md:w-auto px-10 py-4 font-black text-xl uppercase pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
                COMPROBAR
            </button>
        </div>
    );
};

export default ListeningChallenge;