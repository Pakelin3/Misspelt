import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import useAxios from '@/utils/useAxios';

// UI Components
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
    // 'SELECTION' | 'PLAYING' | 'RESULTS'
    const [gameState, setGameState] = useState('SELECTION');
    const [results, setResults] = useState(null);
    const [selectedSkin, setSelectedSkin] = useState('mage');

    // --- ESTADOS DEL QUIZ ---
    const [sessionWords, setSessionWords] = useState([]);
    const sessionWordsRef = useRef([]);
    const [gameWordsTexts, setGameWordsTexts] = useState([]);
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuizWord, setCurrentQuizWord] = useState(null);
    const iframeRef = useRef(null);

    // Personajes disponibles
    const CHARACTERS = [
        { id: 'mage', name: 'Mage', sprite: '/game/skins/mage.png' },
        { id: 'farmer', name: 'Farmer', sprite: '/game/skins/mage.png' },
        { id: 'warlock', name: 'Warlock', sprite: '/game/skins/warlock.png' },
        { id: 'erudit', name: 'Erudit', sprite: '/game/skins/mage.png' },
    ];

    // 1. GESTIÓN DEL NAVBAR
    useEffect(() => {
        const navbar = document.querySelector('nav');
        if (navbar) navbar.style.display = 'none';
        return () => {
            if (navbar) navbar.style.display = 'flex';
        };
    }, []);

    // 2. CARGA DE PALABRAS PARA LA SESIÓN
    useEffect(() => {
        const prepareGame = async () => {
            try {
                const response = await api.get('/game/quiz-words/');
                const data = Array.isArray(response.data) ? response.data : response.data.results || [];
                setSessionWords(data);
                sessionWordsRef.current = data;

                const wordsArray = data.map(w => w.text || w.id);
                setGameWordsTexts(wordsArray);
            } catch (error) {
                console.error("Error cargando palabras:", error);
                setGameWordsTexts(["ERROR", "CHECK", "API"]);
            }
        };
        prepareGame();
    }, [api]);

    // 3. INYECCIÓN DEL PUENTE (GODOT <-> REACT)
    const handleIframeLoad = (e) => {
        console.log("React: Iframe cargado. Inyectando puente de comunicación...");

        const iframeWindow = e.target.contentWindow;
        if (!iframeWindow) {
            console.error("React: No se pudo acceder a la ventana del iframe.");
            return;
        }

        // --- INYECCIÓN 1: TRIGGER QUIZ 
        iframeWindow.triggerQuiz = (wordText) => {
            console.log("React (desde Iframe): 🚨 Petición de Quiz recibida:", wordText);

            if (!wordText) return;

            const wordsList = sessionWordsRef.current;
            const foundWord = wordsList.find(w => {
                const txt = w.text || w.id;
                return txt && typeof txt === 'string' && txt.trim().toUpperCase() === wordText.trim().toUpperCase();
            });

            if (foundWord) {
                console.log("React: Palabra encontrada:", foundWord);
                setCurrentQuizWord(foundWord);
                setShowQuiz(true);
            } else {
                console.warn(`Palabra '${wordText}' no encontrada en memoria.`);
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

        // --- INYECCIÓN 2: GAME OVER 
        const triggerGameOver = async (finalScore, wordsIds = []) => {
            console.log("Game Over recibido:", finalScore);

            // Go to Results immediately for UI responsiveness
            setResults({
                xp_earned: finalScore,
                level: 1, // Fallback until API responds
            });
            setGameState('RESULTS');

            try {
                const response = await api.post('/game/submit-results/', {
                    xp_earned: finalScore,
                    seen_word_ids: wordsIds || [],
                    score: finalScore * 10,
                    correct_answers: Math.floor(finalScore / 10),
                    total_questions: 10
                });

                if (fetchUserData) await fetchUserData();

                setResults((prev) => ({
                    ...prev,
                    new_total_xp: response.data?.new_xp || 0,
                    level: response.data?.new_level || 1
                }));
            } catch (error) {
                console.error("Error al guardar partida:", error);
            }
        };

        // Asignamos a ambos windows por si Godot usa window.parent o window local
        iframeWindow.handleGameOver = triggerGameOver;
        window.handleGameOver = triggerGameOver;
        iframeWindow.onGodotGameOver = triggerGameOver;
        window.onGodotGameOver = triggerGameOver;

        const triggerGodotExit = () => {
            console.log("🚪 Godot solicitó salir del juego.");
            setGameState('SELECTION');
        };

        iframeWindow.onGodotExit = triggerGodotExit;
        window.onGodotExit = triggerGodotExit;

        window.triggerQuiz = iframeWindow.triggerQuiz; // Debugging fallback
    };

    // 4. MANEJO DEL QUIZ (Respuesta de React -> Godot)
    const handleQuizComplete = (score) => {
        setShowQuiz(false);
        const success = score > 0;

        console.log("React: Quiz completado. Éxito:", success);

        if (iframeRef.current && iframeRef.current.contentWindow) {
            const godotWindow = iframeRef.current.contentWindow;

            if (typeof godotWindow.godotQuizCallback === 'function') {
                console.log("React: Enviando respuesta al Iframe Godot...");
                godotWindow.godotQuizCallback(success);
            } else {
                console.error("React: ⚠️ No encontré 'godotQuizCallback' en el iframe. ¿Godot ya cargó?");
            }
        } else {
            console.error("React: Referencia al Iframe perdida.");
        }
    };

    const handleQuizClose = () => {
        setShowQuiz(false);
        if (iframeRef.current && iframeRef.current.contentWindow) {
            const godotWindow = iframeRef.current.contentWindow;
            if (typeof godotWindow.godotQuizCallback === 'function') {
                godotWindow.godotQuizCallback(false);
            }
        }
    };

    const startGame = () => {
        setGameState('PLAYING');
    };

    return (
        <div className="w-full h-screen bg-background text-foreground overflow-hidden font-pixel">

            {/* VISTA A: MENÚ DE SELECCIÓN */}
            {gameState === 'SELECTION' && (
                <div className="flex flex-col items-center justify-center h-full gap-8 p-4 relative z-10">
                    <h1 className="text-4xl md:text-6xl text-center font-black text-primary drop-shadow-pixel animate-in slide-in-from-top-4 duration-500">
                        MISSPELT SURVIVOR
                    </h1>

                    <Card className=" border-primary bg-background p-6 pixel-border w-full max-w-4xl rounded-none animate-in zoom-in-95 duration-500 delay-150">
                        <h2 className="text-2xl font-bold uppercase text-center mb-6 text-foreground">Elige tu Héroe</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {CHARACTERS.map((char) => {
                                const isSelected = selectedSkin === char.id;
                                return (
                                    <div
                                        key={char.id}
                                        onClick={() => setSelectedSkin(char.id)}
                                        className={`
                                            cursor-pointer flex flex-col items-center p-4 border-4 transition-all duration-200
                                            ${isSelected
                                                ? 'border-primary bg-primary/10 scale-105 shadow-xl'
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
                                            {char.id === 'mage' ? 'Mago' : char.id === 'farmer' ? 'Campesino' : char.id === 'warlock' ? 'Brujo' : 'Erudito'}
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

                        <div className="flex gap-4 flex-col md:flex-row">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="w-full md:w-1/3 rounded-none h-16 text-xl pixel-btn border-2"
                            >
                                <ArrowLeft className="mr-2" /> VOLVER
                            </Button>
                            <Button
                                onClick={startGame}
                                className="w-full md:w-2/3 rounded-none h-16 text-2xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <Play className="mr-2 fill-current" /> ¡JUGAR!
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* VISTA B: GAME RUNNING */}
            {gameState === 'PLAYING' && (
                <div className="relative w-full h-full bg-black flex flex-col">
                    {/* Botón de pánico/salida rápida */}
                    <button
                        onClick={() => {
                            if (window.confirm("¿Salir de la partida? Perderás el progreso.")) {
                                setGameState('SELECTION');
                            }
                        }}
                        className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors z-20"
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
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                            <div className="w-full max-w-4xl relative">
                                <QuizManager
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
                                className="h-14 text-xl pixel-btn"
                            >
                                <RotateCcw className="mr-2" /> VOLVER AL MENÚ
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="h-14 text-xl pixel-btn"
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