import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Trophy, AlertCircle, Heart } from 'lucide-react';

// Importamos los 3 minijuegos
import SentenceBuilder from './SentenceBuilder';
import MultiChoice from './MultiChoice';
import ListeningChallenge from './ListeningChallenge';

const QuizManager = ({ words = [], onComplete, onClose }) => {
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
        if (!currentWord) return <div className="text-center animate-pulse">Cargando desafío...</div>;

        const commonProps = {
            key: currentWord.id + gameType,
            word: currentWord,
            onSuccess: handleCorrect,
            onError: handleWrong
        };

        switch (gameType) {
            case 'sentence':
                return <SentenceBuilder {...commonProps} />;

            case 'listening':
                return <ListeningChallenge {...commonProps} />;

            case 'multi':
            default:
                const distractors = words.filter(w => w.id !== currentWord.id);
                return <MultiChoice {...commonProps} distractors={distractors} />;
        }
    };

    // --- VISTA DE DERROTA ---
    if (gameStatus === 'lost') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border-4 border-red-900 pixel-border animate-in zoom-in duration-300">
                <AlertCircle size={80} className="text-red-600 mb-6 drop-shadow-md" />
                <h2 className="text-3xl font-bold text-red-900 mb-2 font-pixel">GAME OVER</h2>
                <p className="mb-6 text-red-800 text-lg">¡La temible <span className="font-bold text-2xl">Ñ</span> ha despertado!</p>
                <button onClick={onClose} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold text-xl border-b-4 border-red-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all">
                    Aceptar Destino
                </button>
            </div>
        );
    }

    // --- VISTA DE VICTORIA ---
    if (gameStatus === 'won') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 rounded-xl border-4 border-green-900 pixel-border animate-in zoom-in duration-300">
                <Trophy size={80} className="text-yellow-500 mb-6 animate-bounce drop-shadow-md" />
                <h2 className="text-3xl font-bold text-green-900 mb-2 font-pixel">¡VICTORIA!</h2>
                <p className="mb-6 text-green-800 text-lg">Has dominado estas palabras.</p>
                <div className="bg-white px-6 py-3 rounded-lg border-2 border-green-200 mb-6">
                    <p className="text-2xl font-bold text-green-700">+{score} XP</p>
                </div>
                <button onClick={onClose} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-xl border-b-4 border-green-900 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all">
                    Continuar
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-[#FDF6E3] p-6 rounded-xl border-4 border-[#3E261D] pixel-border relative shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-[#3E261D]/10 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#3E261D]/60 uppercase tracking-wider">Puntuación</span>
                    <div className="bg-[#3E261D] text-[#FDF6E3] px-3 py-1 rounded text-sm font-bold font-mono">
                        {score.toString().padStart(4, '0')}
                    </div>
                </div>

                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <Heart
                            key={i}
                            size={24}
                            className={`${i < lives ? 'fill-red-500 text-red-600' : 'fill-gray-300 text-gray-400'} transition-all duration-300`}
                        />
                    ))}
                </div>

                <button onClick={onClose} className="text-[#3E261D]/40 hover:text-red-500 transition-colors p-1 hover:bg-red-100 rounded-full">
                    <X size={24} />
                </button>
            </div>

            {/* Área de Juego */}
            <div className="min-h-[350px] flex items-center justify-center overflow-hidden">
                {/* Usamos una simple animación CSS keyframe o clases de utilidad */}
                <div
                    key={currentIndex}
                    className="w-full flex justify-center animate-in fade-in slide-in-from-right-8 duration-500"
                >
                    {renderGame()}
                </div>
            </div>

            {/* Barra de Progreso */}
            <div className="mt-8 relative h-4 bg-[#3E261D]/10 rounded-full overflow-hidden border border-[#3E261D]/20">
                <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex) / words.length) * 100}%` }}
                />
            </div>
            <p className="text-center text-xs font-bold text-[#3E261D]/40 mt-2">
                {currentIndex + 1} de {words.length}
            </p>
        </div>
    );
};

export default QuizManager;