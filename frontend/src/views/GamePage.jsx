import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import useAxios from '@/utils/useAxios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Trophy, Clock, Star, Home, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import SpriteAnimator from '@/components/ui/SpriteAnimator';
import QuizManager from '@/components/quiz/QuizManager';

const GamePage = () => {
    const navigate = useNavigate();
    const api = useAxios();
    const { fetchUserData } = useContext(AuthContext);

    // --- MÁQUINA DE ESTADOS DEL JUEGO ---
    const [gameState, setGameState] = useState('SELECTION');
    const [results, setResults] = useState(null);
    const [selectedSkin, setSelectedSkin] = useState('mage');
    const [difficulty, setDifficulty] = useState('NORMAL');

    // --- ESTADOS DEL QUIZ ---
    const [sessionWords, setSessionWords] = useState([]);
    const sessionWordsRef = useRef([]);
    const seenWordsRef = useRef(new Set());
    const correctWordsRef = useRef(new Set());

    const [gameWordsTexts, setGameWordsTexts] = useState([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuizWord, setCurrentQuizWord] = useState(null);
    const iframeRef = useRef(null);

    // Personajes disponibles con sus estadísticas e historia
    const CHARACTERS = [
        {
            id: 'mage', name: 'Mago', sprite: '/game/skins/mage.png',
            stats: { hp: 100, dmg: 10, spd: 350 },
            lore: "Un aprendiz de las artes arcanas que descubrió que las palabras encierran el verdadero poder del universo. Busca el glosario perdido para restaurar el orden."
        },
        {
            id: 'farmer', name: 'Campesino', sprite: '/game/skins/mage.png', // Temporal: mage.png
            stats: { hp: 120, dmg: 8, spd: 300 },
            lore: "Cansado de que las plagas arruinaran sus cosechas, tomó su horca y aprendió a deletrear hechizos básicos para defender su granja."
        },
        {
            id: 'warlock', name: 'Brujo', sprite: '/game/skins/warlock.png',
            stats: { hp: 80, dmg: 12, spd: 200 },
            lore: "Hizo un pacto con entidades oscuras a cambio de conocimiento prohibido. Su magia es destructiva, pero su fragilidad física es su mayor debilidad."
        },
        {
            id: 'erudit', name: 'Erudito', sprite: '/game/skins/erudit.png',
            stats: { hp: 100, dmg: 15, spd: 314.1 },
            lore: "Un bibliotecario ermitaño que ha leído miles de libros. Su velocidad mental y física le permiten esquivar peligros mientras formula encantamientos precisos."
        },
    ];

    const currentCharacter = CHARACTERS.find(c => c.id === selectedSkin) || CHARACTERS[0];

    // 1. GESTIÓN DEL NAVBAR
    useEffect(() => {
        const navbar = document.querySelector('nav');
        if (navbar) navbar.style.display = 'none';
        return () => {
            if (navbar) navbar.style.display = 'flex';
        };
    }, []);

    const [isPreparing, setIsPreparing] = useState(false);
    const handleIframeLoad = (e) => {
        console.log("React: Iframe cargado. Inyectando puente de comunicación...");

        const iframeWindow = e.target.contentWindow;
        if (!iframeWindow) {
            console.error("React: No se pudo acceder a la ventana del iframe.");
            return;
        }

        iframeWindow.triggerQuiz = (wordText) => {
            console.log("React (desde Iframe): 🚨 Petición de Quiz recibida:", wordText);

            if (!wordText) return;

            const currentWords = sessionWordsRef.current;

            const foundWord = currentWords.find(w => {
                const txt = w.text || w.id;
                return txt && typeof txt === 'string' && txt.trim().toUpperCase() === wordText.trim().toUpperCase();
            });

            if (foundWord) {
                console.log("React: Palabra encontrada:", foundWord);
                seenWordsRef.current.add(foundWord.id);
                setCurrentQuizWord(foundWord);
                setShowQuiz(true);
            } else {
                console.warn(`Palabra '${wordText}' no encontrada en memoria. Disponibles:`, currentWords);
                setCurrentQuizWord({
                    id: 9999,
                    text: wordText,
                    translation: "...",
                    definition: "Definición no disponible.",
                    examples: []
                });
                setShowQuiz(true);
            }
        };

        iframeWindow.handleGameOver = async (finalScore, timeSpentSeconds = 0) => {
            console.log("Game Over recibido:", finalScore, "Tiempo:", timeSpentSeconds);

            setResults({ xp_earned: finalScore, level: 1 });
            setGameState('RESULTS');

            try {
                const response = await api.post('/game/submit-results/', {
                    xp_earned: finalScore,
                    time_spent: timeSpentSeconds,
                    seen_word_ids: Array.from(seenWordsRef.current),
                    correct_word_ids: Array.from(correctWordsRef.current),
                    score: finalScore * 10,
                    correct_answers: Array.from(correctWordsRef.current).length,
                    total_questions: Array.from(seenWordsRef.current).length,
                    game_mode: 'SURVIVOR'
                });

                if (fetchUserData) await fetchUserData();

                setResults((prev) => ({
                    ...prev,
                    new_total_xp: response.data?.new_xp || 0,
                    level: response.data?.new_level || 1,
                    time_spent: response.data?.time_spent || timeSpentSeconds,
                    breakdown: response.data?.match_breakdown
                }));

                const finalCorrectAnswers = Array.from(correctWordsRef.current).length;
                if (finalCorrectAnswers > 0) {
                    toast.success('Nuevas palabras añadidas al diccionario', {
                        description: `Has aprendido o repasado ${finalCorrectAnswers} palabra${finalCorrectAnswers === 1 ? '' : 's'}.`,
                    });
                }

                if (response.data?.badges_unlocked && response.data.badges_unlocked.length > 0) {
                    response.data.badges_unlocked.forEach(badge => {
                        toast('¡Insignia Desbloqueada!', {
                            description: badge.title,
                            icon: badge.image ? <img src={badge.image} alt={badge.title} className="w-8 h-8 rounded-full pixel-rendering" /> : <Trophy className="w-6 h-6 text-yellow-500" />,
                            duration: 5000,
                        });
                    });
                }
            } catch (error) {
                console.error("Error al guardar partida (API):", error);
            }
        };

        iframeWindow.onGodotExit = () => {
            console.log("🚪 Godot solicitó salir del juego.");
            setGameState('SELECTION');
        };
    };

    const sendToGodot = (success) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            const godotWindow = iframeRef.current.contentWindow;

            if (typeof godotWindow.godotQuizCallback === 'function') {
                console.log(`React: Enviando respuesta al Iframe Godot (${success})...`);
                godotWindow.godotQuizCallback(success);
            } else {
                console.error("React: ⚠️ No encontré 'godotQuizCallback' en el iframe.");
            }
        } else {
            console.error("React: Referencia al Iframe perdida.");
        }
    };

    const handleQuizComplete = (score) => {
        setShowQuiz(false);
        const success = score > 0;
        if (success && currentQuizWord) {
            correctWordsRef.current.add(currentQuizWord.id);
        }
        console.log("React: Quiz completado (Victoria).");
        sendToGodot(success);
    };

    const handleQuizClose = () => {
        setShowQuiz(false);
        console.log("React: Quiz cerrado manualmente o derrota (X).");
        sendToGodot(false);
    };

    const startGame = async () => {
        if (isPreparing) return;
        setIsPreparing(true);

        try {
            console.log(`React: Solicitando palabras para la partida (Dificultad: ${difficulty})...`);
            const response = await api.get(`/game/quiz-words/?difficulty=${difficulty}`);
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];

            setSessionWords(data);
            sessionWordsRef.current = data;

            const wordsArray = data.map(w => w.text || "ERROR");
            setGameWordsTexts(wordsArray);
            console.log("React: Palabras listas para Godot:", wordsArray);

            setGameState('PLAYING');
        } catch (error) {
            console.error("Error cargando palabras antes de iniciar:", error);
            setGameWordsTexts(["ERROR", "FALLBACK"]);
            setGameState('PLAYING');
        } finally {
            setIsPreparing(false);
        }
    };

    return (
        <div className="w-full h-screen bg-background text-foreground overflow-hidden font-pixel">

            {/* VISTA A: MENÚ DE SELECCIÓN */}
            {gameState === 'SELECTION' && (
                <div className="flex flex-col items-center justify-center h-full gap-8 p-4 relative z-10">
                    <h1 className="text-4xl md:text-6xl text-center font-black text-primary drop-shadow-pixel animate-in slide-in-from-top-4 duration-500">
                        MISSPELT SURVIVOR
                    </h1>

                    <Card className=" border-primary bg-background p-6 pixel-border w-full max-w-5xl rounded-none animate-in zoom-in-95 duration-500 delay-150">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Panel Izquierdo: Selección de Personaje */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold uppercase text-center mb-6 text-foreground">Elige tu Héroe</h2>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {CHARACTERS.map((char) => {
                                        const isSelected = selectedSkin === char.id;
                                        return (
                                            <div
                                                key={char.id}
                                                onClick={() => setSelectedSkin(char.id)}
                                                className={`
                                                    cursor-pointer flex flex-col items-center p-4 border-4 transition-all duration-200
                                                    ${isSelected
                                                        ? 'border-primary bg-primary/10 scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                                        : 'border-muted bg-muted/50 hover:border-primary/50 hover:scale-105'
                                                    }
                                                `}
                                            >
                                                <div className="mb-2 overflow-hidden pixel-rendering">
                                                    <SpriteAnimator
                                                        src={char.sprite}
                                                        frameWidth={32}
                                                        frameHeight={32}
                                                        frameCount={4}
                                                        fps={isSelected ? 8 : 4}
                                                        scale={3}
                                                        style={{
                                                            filter: isSelected ? 'none' : 'grayscale(100%) opacity(0.7)'
                                                        }}
                                                    />
                                                </div>
                                                <span className={`uppercase font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {char.name}
                                                </span>
                                                {isSelected && (
                                                    <div className="absolute -top-3 -right-3 bg-primary text-black p-1 rounded-full shadow-lg animate-bounce hidden md:block">
                                                        <Star size={16} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Panel Derecho: Lore, Stats y Opciones */}
                            <div className="flex-1 flex flex-col justify-between bg-muted/20 border-4 border-foreground p-6 relative">
                                <div className="absolute top-0 left-0 w-2 h-2 bg-foreground"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 bg-foreground"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 bg-foreground"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-foreground"></div>

                                <div>
                                    <h3 className="text-3xl font-black text-primary uppercase mb-2 drop-shadow-sm">
                                        {currentCharacter.name}
                                    </h3>
                                    <p className="text-base font-sans text-muted-foreground italic mb-6 leading-relaxed border-l-4 border-primary pl-4">
                                        "{currentCharacter.lore}"
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm uppercase">Salud (HP)</span>
                                            <div className="flex flex-1 mx-4 h-4 bg-background border-2 border-foreground">
                                                <div className="h-full bg-red-500" style={{ width: `${(currentCharacter.stats.hp / 200) * 100}%` }}></div>
                                            </div>
                                            <span className="text-sm">{currentCharacter.stats.hp}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm uppercase">Daño (DMG)</span>
                                            <div className="flex flex-1 mx-4 h-4 bg-background border-2 border-foreground">
                                                <div className="h-full bg-orange-500" style={{ width: `${(currentCharacter.stats.dmg / 20) * 100}%` }}></div>
                                            </div>
                                            <span className="text-sm">{currentCharacter.stats.dmg}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm uppercase">Velocidad</span>
                                            <div className="flex flex-1 mx-4 h-4 bg-background border-2 border-foreground">
                                                <div className="h-full bg-blue-500" style={{ width: `${(currentCharacter.stats.spd / 500) * 100}%` }}></div>
                                            </div>
                                            <span className="text-sm">{currentCharacter.stats.spd}</span>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <span className="block font-bold text-sm uppercase mb-2 text-center text-muted-foreground">Dificultad de Palabras</span>
                                        <div className="flex grid-cols-3 gap-2">
                                            {['EASY', 'NORMAL', 'HARD'].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setDifficulty(lvl)}
                                                    className={`
                                                        flex-1 py-2 text-xs font-bold uppercase pixel-btn border-2 transition-all
                                                        ${difficulty === lvl
                                                            ? 'border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]'
                                                            : 'border-muted-foreground bg-background text-muted-foreground hover:bg-muted/50'}
                                                    `}
                                                >
                                                    {lvl === 'EASY' ? 'FÁCIL' : lvl === 'NORMAL' ? 'NORMAL' : 'DIFÍCIL'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 flex-col lg:flex-row mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/')}
                                        className="w-full lg:w-1/3 rounded-none h-14 text-sm pixel-btn border-2 border-foreground hover:bg-muted"
                                    >
                                        <ArrowLeft className="mr-2" /> VOLVER
                                    </Button>
                                    <Button
                                        onClick={startGame}
                                        disabled={isPreparing}
                                        className={`w-full lg:w-2/3 rounded-none h-14 text-xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-accent text-accent-foreground ${isPreparing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isPreparing ? (
                                            <>
                                                <div className="w-5 h-5 border-4 border-foreground border-t-transparent animate-spin rounded-full mr-2"></div>
                                                CARGANDO...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 fill-current" /> INICIAR PARTIDA
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* VISTA B: GAME RUNNING */}
            {gameState === 'PLAYING' && (
                <div className="relative w-full h-full bg-black flex flex-col">
                    <button
                        onClick={() => {
                            if (window.confirm("¿Salir de la partida? Perderás el progreso.")) {
                                setGameState('SELECTION');
                            }
                        }}
                        className="absolute top-20 left-4 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors z-20"
                    >
                        <Home size={20} />
                    </button>

                    <iframe
                        ref={iframeRef}
                        src={`/game/index.html?skin=${selectedSkin}&words=${gameWordsTexts.join(',')}`}
                        onLoad={handleIframeLoad}
                        className="w-full h-full border-none focus:outline-none block"
                        title="Godot Game"
                        allow="autoplay; fullscreen; clipboard-write"
                    />

                    {/* MODAL DEL QUIZ */}
                    {showQuiz && currentQuizWord && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                            <div className="w-full max-w-5xl relative">
                                <QuizManager
                                    mode="game"
                                    words={[currentQuizWord]}
                                    allWords={sessionWords}
                                    onComplete={handleQuizComplete}
                                    onClose={handleQuizClose}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* VISTA C: RESULTADOS */}
            {gameState === 'RESULTS' && results && (
                <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300 p-4">
                    <Card className="w-full max-w-lg border-8 border-double border-primary bg-background p-8 text-center space-y-8">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto animate-bounce" />
                        <h2 className="text-4xl font-bold uppercase italic text-primary drop-shadow-sm">Resumen de Partida</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted p-4 border-4 border-muted-foreground">
                                <Star className="text-primary mx-auto mb-2" />
                                <p className="text-sm uppercase font-bold text-muted-foreground">XP Ganada</p>
                                <p className="text-3xl font-black text-foreground">+{results.xp_earned}</p>
                            </div>
                            <div className="bg-muted p-4 border-4 border-muted-foreground">
                                <Trophy className="text-primary mx-auto mb-2" />
                                <p className="text-sm uppercase font-bold text-muted-foreground">Nivel Actual</p>
                                <p className="text-3xl font-black text-foreground">{results.level}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                onClick={() => setGameState('SELECTION')}
                                className="h-14 text-xl pixel-btn rounded-none"
                            >
                                <RotateCcw className="mr-2" /> VOLVER AL MENÚ
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="h-14 text-xl pixel-btn rounded-none"
                            >
                                <Home className="mr-2" /> IR AL HOME
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GamePage;