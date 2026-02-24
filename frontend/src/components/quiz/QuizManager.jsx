import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Trophy, AlertCircle, Heart } from 'lucide-react';

// Importamos los 3 minijuegos
import SentenceBuilder from './SentenceBuilder';
import MultiChoice from './MultiChoice';
import ListeningChallenge from './ListeningChallenge';

const QuizManager = ({ words = [], allWords = [], onComplete, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameStatus, setGameStatus] = useState('playing');
    const [currentWord, setCurrentWord] = useState(null);
    const [gameType, setGameType] = useState('multi');

    useEffect(() => {
        if (words.length > 0 && currentIndex < words.length) {
            const word = words[currentIndex];
            setCurrentWord(word);

            // LÓGICA DE SELECCIÓN DE JUEGO:
            const availableTypes = ['multi', 'listening'];

            if (word.examples && word.examples.length > 0) {
                availableTypes.push('sentence');
                availableTypes.push('sentence');
            }

            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            setGameType(randomType);

        } else if (currentIndex >= words.length && words.length > 0) {
            handleWin();
        }
    }, [currentIndex, words]);

    const handleWin = () => {
        setGameStatus('won');
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
        });
        setTimeout(() => {
            if (onComplete) onComplete(score);
        }, 3000);
    };

    const handleCorrect = () => {
        setScore(s => s + 100);
        setTimeout(() => {
            setCurrentIndex(i => i + 1);
        }, 800);
    };

    const handleWrong = () => {
        setLives(l => l - 1);
        if (lives <= 1) {
            setGameStatus('lost');
        }
    };

    const renderGame = () => {
        if (!currentWord) return <div className="text-center font-pixel animate-pulse text-primary">Cargando desafío...</div>;

        const commonProps = {
            word: currentWord,
            onSuccess: handleCorrect,
            onError: handleWrong
        };

        switch (gameType) {
            case 'sentence':
                return <SentenceBuilder key={currentWord.id + gameType} {...commonProps} />;
            case 'listening':
                return <ListeningChallenge key={currentWord.id + gameType} {...commonProps} />;
            default:
                return <MultiChoice key={currentWord.id + gameType} {...commonProps} distractors={distractors} />;
        }
    };

    // --- VISTA DE DERROTA ---
    if (gameStatus === 'lost') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-none border-4 border-primary pixel-border animate-in zoom-in duration-300 shadow-[8px_8px_0px_0px_rgba(var(--primary),0.5)]">
                <AlertCircle size={80} className="text-destructive mb-6 drop-shadow-md" />
                <h2 className="text-4xl font-black text-destructive mb-4 font-pixel tracking-wider drop-shadow-sm">GAME OVER</h2>
                <p className="mb-8 text-foreground text-xl font-sans font-bold">¡La temible <span className="text-3xl text-destructive font-black">Ñ</span> ha despertado!</p>
                <button onClick={onClose} className="w-full md:w-auto px-10 py-4 uppercase font-bold text-xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Aceptar Destino
                </button>
            </div>
        );
    }

    // --- VISTA DE VICTORIA ---
    if (gameStatus === 'won') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-none border-4 border-primary pixel-border animate-in zoom-in duration-300 shadow-[8px_8px_0px_0px_rgba(var(--primary),0.5)]">
                <Trophy size={80} className="text-yellow-500 mb-6 animate-bounce drop-shadow-md" />
                <h2 className="text-4xl font-black text-primary mb-4 font-pixel tracking-wider drop-shadow-sm">¡VICTORIA!</h2>
                <p className="mb-8 text-foreground text-xl font-sans font-bold">Has dominado estas palabras.</p>
                <div className="bg-muted px-8 py-4 border-4 border-primary mb-8 pixel-border shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)]">
                    <p className="text-3xl font-black text-primary font-pixel">+{score} XP</p>
                </div>
                <button onClick={onClose} className="w-full md:w-auto px-10 py-4 uppercase font-bold text-xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Continuar
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-background p-6 rounded-none border-4 border-primary pixel-border relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b-4 border-primary pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-pixel">Puntos</span>
                    <div className="bg-primary text-primary-foreground px-3 py-2 text-sm font-black font-pixel shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                        {score.toString().padStart(4, '0')}
                    </div>
                </div>

                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <Heart
                            key={i}
                            size={28}
                            className={`${i < lives ? 'fill-destructive text-destructive drop-shadow-sm' : 'fill-muted text-muted-foreground opacity-50'} transition-all duration-300`}
                        />
                    ))}
                </div>

                <button onClick={onClose} className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 active:scale-95 border-2 border-transparent hover:border-destructive pixel-border">
                    <X size={28} strokeWidth={3} />
                </button>
            </div>

            {/* Área de Juego */}
            <div className="min-h-[350px] flex items-center justify-center overflow-hidden">
                <div
                    key={currentIndex}
                    className="w-full flex justify-center animate-in fade-in slide-in-from-right-8 duration-500"
                >
                    {renderGame()}
                </div>
            </div>

            {/* Barra de Progreso */}
            <div className="mt-8 relative h-6 bg-muted border-4 border-primary overflow-hidden pixel-border">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex) / words.length) * 100}%` }}
                />
            </div>
            <p className="text-center text-sm font-bold text-muted-foreground mt-3 font-pixel">
                {currentIndex + 1} / {words.length}
            </p>
        </div>
    );
};

export default QuizManager;