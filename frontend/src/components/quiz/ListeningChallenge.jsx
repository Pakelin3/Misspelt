import { useState, useEffect, useRef } from 'react';
import { Volume2, Mic } from 'lucide-react';

const ListeningChallenge = ({ word, onSuccess, onError }) => {
    const [inputValue, setInputValue] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [feedback, setFeedback] = useState(null); // null, 'correct', 'wrong'
    const inputRef = useRef(null);

    useEffect(() => {
        setInputValue("");
        setFeedback(null);
        // Enfocar el input automáticamente al cargar
        setTimeout(() => inputRef.current?.focus(), 100);
        // Reproducir audio automáticamente (opcional, algunos navegadores lo bloquean sin interacción)
        // playAudio(); 
    }, [word]);

    const playAudio = () => {
        if ('speechSynthesis' in window) {
            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(word.text);
            utterance.lang = 'en-US'; // Aseguramos acento americano
            utterance.rate = 0.9; // Un poquito más lento para que se entienda bien

            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Tu navegador no soporta audio :(");
        }
    };

    const checkAnswer = (e) => {
        e.preventDefault();
        if (feedback) return;

        const cleanInput = inputValue.trim().toLowerCase();
        const cleanTarget = word.text.trim().toLowerCase();

        // Verificamos si coincide con la palabra o con alguno de sus sinónimos aceptados
        const isSynonym = word.substitutes && word.substitutes.some(s => s.toLowerCase() === cleanInput);

        if (cleanInput === cleanTarget || isSynonym) {
            setFeedback('correct');
            // Sonido de éxito sutil (opcional)
            setTimeout(onSuccess, 1000);
        } else {
            setFeedback('wrong');
            setTimeout(() => {
                setFeedback(null); // Permitir reintentar sin castigo inmediato, o llamar onError()
                onError();
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full max-w-lg">
            <div className="text-center space-y-4">
                <h3 className="text-lg font-pixel text-muted-foreground uppercase">Escucha y Escribe</h3>

                <button
                    onClick={playAudio}
                    className={`
            w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-xl transition-all
            ${isPlaying
                            ? 'bg-primary text-white border-green-800 scale-110'
                            : 'bg-white text-primary border-gray-200 hover:scale-105'
                        }
          `}
                >
                    <Volume2 size={48} className={isPlaying ? 'animate-pulse' : ''} />
                </button>
                <p className="text-sm text-gray-400">Click para escuchar</p>
            </div>

            <form onSubmit={checkAnswer} className="w-full relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={feedback === 'correct'}
                    placeholder="Escribe lo que escuchas..."
                    className={`
            w-full p-4 pl-12 text-xl font-bold text-center rounded-xl border-4 outline-none transition-colors
            ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : ''}
            ${feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-700' : ''}
            ${!feedback ? 'border-gray-300 focus:border-primary' : ''}
          `}
                />
                <Mic className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            </form>

            <div className="h-8">
                {feedback === 'wrong' && (
                    <p className="text-red-500 font-bold animate-bounce">¡Ups! Inténtalo de nuevo.</p>
                )}
            </div>

            <button
                onClick={checkAnswer}
                disabled={!inputValue || feedback}
                className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-bold text-lg border-b-4 border-green-900 hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                COMPROBAR
            </button>
        </div>
    );
};

export default ListeningChallenge;