import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { PixelHeartIcon } from '@/components/PixelIcons';
import SentenceBuilder from './SentenceBuilder';
import MultiChoice from './MultiChoice';
import ListeningChallenge from './ListeningChallenge';

const GameRenderer = ({ currentWord, gameType, handleCorrect, handleWrong, allWords, words }) => {
    if (!currentWord) return <div className="text-center font-pixel animate-pulse text-primary">Cargando desafío...</div>;

    const uniqueKey = currentWord.id + gameType;
    const commonProps = {
        word: currentWord,
        onSuccess: handleCorrect,
        onError: handleWrong
    };

    const getDistractors = () => {
        const source = (allWords && allWords.length > 0) ? allWords : words;
        return source.filter(w => w.id !== currentWord.id);
    };

    switch (gameType) {
        case 'sentence':
            return <SentenceBuilder key={uniqueKey} {...commonProps} />;
        case 'listening':
            return <ListeningChallenge key={uniqueKey} {...commonProps} />;
        case 'multi':
        default: {
            const distractors = getDistractors();
            return <MultiChoice key={uniqueKey} {...commonProps} distractors={distractors} />;
        }
    }
};

const EMPTY_WORDS = [];
const EMPTY_ALL_WORDS = [];

const QuizManager = ({ words = EMPTY_WORDS, allWords = EMPTY_ALL_WORDS, onComplete, onClose, mode = 'practice', initialLives = 3, onLose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(() => initialLives);
    const [gameStatus, setGameStatus] = useState('playing');
    const [currentWord, setCurrentWord] = useState(null);
    const [gameType, setGameType] = useState('multi');

    // Use a ref to track the words array to avoid re-triggering the effect on parent re-renders
    const wordsRef = useRef(words);
    wordsRef.current = words;

    useEffect(() => {
        const currentWords = wordsRef.current;
        if (currentWords.length > 0 && currentIndex < currentWords.length) {
            const word = currentWords[currentIndex];
            setCurrentWord(word);

            const availableTypes = ['multi', 'listening'];

            if (word.examples && word.examples.length > 0) {
                availableTypes.push('sentence');
                availableTypes.push('sentence');
            }

            const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            setGameType(randomType);

        } else if (currentIndex >= currentWords.length && currentWords.length > 0) {
            handleWin();
        }
    }, [currentIndex]);

    const handleWin = () => {
        setGameStatus('won');
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
        });
    };

    const handleCorrect = () => {
        setScore(s => s + 100);
        setTimeout(() => {
            setCurrentIndex(i => i + 1);
        }, 800);
    };

    const handleWrong = () => {
        setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
                if (onLose) {
                    onLose();
                } else {
                    setGameStatus('lost');
                }
            }
            return newLives;
        });
    };

    // --- VISTA DE DERROTA ---
    if (gameStatus === 'lost') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-none border-4 border-primary pixel-border animate-in zoom-in duration-300 shadow-[8px_8px_0px_0px_rgba(var(--primary),0.5)]">
                <AlertCircle size={80} className="text-destructive mb-6 drop-shadow-md" />
                <h2 className="text-4xl font-black text-destructive mb-4 font-pixel tracking-wider drop-shadow-sm">
                    {mode === 'game' ? '¡OH NO...!' : '¡INTÉNTALO DE NUEVO!'}
                </h2>
                <p className="mb-8 text-foreground text-xl font-sans font-bold">
                    {mode === 'game' ? (
                        <>¡La temible <span className="text-3xl text-destructive font-black">Ñ</span> ha despertado!</>
                    ) : (
                        'Se te han acabado las vidas. ¡La práctica hace al maestro!'
                    )}
                </p>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <button onClick={onClose} className="w-full md:w-auto px-8 md:px-10 py-4 uppercase bg-accent font-bold text-lg md:text-xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        {mode === 'game' ? 'Aceptar Destino' : 'Volver'}
                    </button>
                    {mode === 'practice' && !onLose && (
                        <button onClick={() => { setLives(initialLives); setScore(0); setCurrentIndex(0); setGameStatus('playing'); }} className="w-full md:w-auto px-8 md:px-10 py-4 uppercase font-bold text-lg md:text-xl bg-primary text-primary-foreground pixel-btn pixel-border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                            Reintentar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- VISTA DE VICTORIA ---
    if (gameStatus === 'won') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-none border-4 border-primary pixel-border animate-in zoom-in duration-300 shadow-[8px_8px_0px_0px_rgba(var(--primary),0.5)]">
                <Trophy size={80} className="text-yellow-500 mb-6 animate-bounce drop-shadow-md" />
                <h2 className="text-4xl font-black text-primary mb-4 font-pixel tracking-wider drop-shadow-sm">
                    {mode === 'game' ? '¡VAMOS!' : '¡COMPLETADO!'}
                </h2>
                <p className="mb-8 text-foreground text-xl font-sans font-bold">Has dominado estas palabras.</p>
                <div className="bg-muted px-8 py-4 border-4 border-primary mb-8 pixel-border shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)]">
                    <p className="text-3xl font-black text-primary font-pixel">+{score} XP</p>
                </div>
                <button onClick={() => onComplete(score)} className="w-full md:w-auto px-10 bg-primary text-primary-foreground py-4 uppercase font-bold text-xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    Continuar
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto bg-background p-4 md:p-6 rounded-none border-4 border-primary pixel-border relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b-4 border-primary pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-pixel">Puntos</span>
                    <div className="bg-primary text-primary-foreground px-3 py-2 text-sm font-black font-pixel shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                        {score.toString().padStart(4, '0')}
                    </div>
                </div>

                <div className="flex gap-1">
                    {[...Array(initialLives)].map((_, i) => (
                        <PixelHeartIcon
                            key={`life-${i}`}
                            className={`w-7 h-7 ${i < lives ? 'fill-destructive text-destructive drop-shadow-sm' : 'fill-muted text-muted-foreground opacity-50'} transition-all duration-300`}
                        />
                    ))}
                </div>

                {mode !== 'game' && (
                    <button onClick={onClose} className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 active:scale-95 border-2 border-transparent hover:border-destructive pixel-border">
                        <X size={28} strokeWidth={3} />
                    </button>
                )}
            </div>

            {/* Área de Juego */}
            <div className="min-h-[350px] flex items-center justify-center overflow-hidden">
                <div
                    key={currentIndex}
                    className="w-full flex justify-center animate-in fade-in slide-in-from-right-8 duration-500"
                >
                    <GameRenderer
                        currentWord={currentWord}
                        gameType={gameType}
                        handleCorrect={handleCorrect}
                        handleWrong={handleWrong}
                        allWords={allWords}
                        words={words}
                    />
                </div>
            </div>

            {/* Barra de Progreso */}
            {/* <div className="mt-8 relative h-6 bg-muted border-4 border-primary overflow-hidden pixel-border">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex) / words.length) * 100}%` }}
                />
            </div>
            <p className="text-center text-sm font-bold text-muted-foreground mt-3 font-pixel">
                {currentIndex + 1} / {words.length}
            </p> */}
        </div>
    );
};

export default QuizManager;