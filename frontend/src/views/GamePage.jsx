import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import useAxios from '@/utils/useAxios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PixelPlayIcon, TrophyIcon, PixelClockIcon, PixelStarIcon, PixelHomeIcon, PixelRestartIcon, PixelArrowLeftIcon, PixelSparklesIcon, PixelLockIcon, BookIcon, PixelTargetIcon, SwordIcon, LeafIcon, PixelSkullIcon, PixelFireIcon, PixelMagicOrbIcon, PixelLightningIcon, PixelMoonIcon, PixelHoleIcon, PixelBookOpenIcon } from '@/components/PixelIcons';
import SpriteAnimator from '@/components/ui/SpriteAnimator';
import QuizManager from '@/components/quiz/QuizManager';
import OracleChat from '@/components/game/OracleChat';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const GamePage = () => {
    const navigate = useNavigate();
    const api = useAxios();
    const { user, fetchUserData } = useContext(AuthContext);

    // --- MÁQUINA DE ESTADOS DEL JUEGO ---
    // 'SELECTION' | 'PLAYING' | 'AI_EVALUATION' | 'RESULTS'
    const [gameState, setGameState] = useState('SELECTION');
    const [results, setResults] = useState(null);
    const [pendingGameData, setPendingGameData] = useState(null); // [NEW] Save game data until AI is done
    const [selectedSkin, setSelectedSkin] = useState('mage');
    const [difficulty, setDifficulty] = useState('NORMAL');
    const [unlockedCharacters, setUnlockedCharacters] = useState(['mage']);

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
            lore: "Un aprendiz de las artes arcanas que descubrió que las palabras encierran el verdadero poder del universo. Busca el glosario perdido para restaurar el orden.",
            unlockReq: "Desbloqueado por defecto"
        },
        {
            id: 'warlock', name: 'Brujo', sprite: '/game/skins/warlock.png',
            stats: { hp: 20, dmg: 18, spd: 380 },
            lore: "Hizo un pacto con entidades oscuras a cambio de conocimiento prohibido. Su magia es destructiva, pero su fragilidad física es su mayor debilidad.",
            unlockReq: "Derrota al menos 1 Jefe en una partida."
        },
        {
            id: 'erudit', name: 'Erudito', sprite: '/game/skins/erudit.png',
            stats: { hp: 80, dmg: 12, spd: 314.1 },
            lore: "Un bibliotecario ermitaño que ha leído miles de libros. Su velocidad mental y física le permiten esquivar peligros mientras formula encantamientos precisos.",
            unlockReq: "Responde correctamente 100 preguntas en total."
        },
        {
            id: 'farmer', name: 'Campesino', sprite: '/game/skins/farmer.png',
            stats: { hp: 150, dmg: 15, spd: 280 },
            lore: "Cansado de que las plagas arruinaran sus cosechas, tomó su guadaña y aprendió a deletrear hechizos básicos para defender su granja.",
            unlockReq: "Elimina a 2000 palabras enemigas."
        },
    ];

    const UPGRADES = {
        mage: [
            { name: 'Multicast', tier: 'Nv. 1-3', desc: 'Añade un proyectil adicional. (Máximo 4 proyectiles a la vez).', icon: PixelMagicOrbIcon, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
            { name: 'Disparo Perforante', tier: 'Nv. 4', desc: 'Los proyectiles ahora atraviesan a 1 enemigo.', icon: PixelStarIcon, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
            { name: 'Archimago', tier: 'Nv. 5+', desc: '+20% de Daño Total. (Mejora infinita para el endgame).', icon: PixelLightningIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', ultimate: true },
        ],
        warlock: [
            { name: 'Corrupción', tier: 'Nv. 1-3', desc: 'Aumenta el tamaño de tu aura oscura en un 15%.', icon: PixelMoonIcon, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
            { name: 'Vacío Famélico', tier: 'Nv. 4-5', desc: 'El aura hace daño un 20% más rápido (reduce el tiempo entre ticks).', icon: PixelHoleIcon, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
            { name: 'Segador de Almas', tier: 'DEF', desc: 'Los enemigos que mueren dentro de tu aura curan 1 HP (cooldown: 2s).', icon: PixelSkullIcon, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40', ultimate: true },
        ],
        erudit: [
            { name: 'Más Conocimiento', tier: 'x6', desc: 'Añade un libro adicional a tu órbita defensiva.', icon: PixelBookOpenIcon, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
            { name: 'Lectura Rápida', tier: 'MAX', desc: 'Los libros giran un 30% más rápido a tu alrededor.', emoji: '💨', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' },
            { name: 'Libros Pesados', tier: 'DEF', desc: '+10% daño general e infligen +50% de Empuje (Knockback).', icon: BookIcon, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', ultimate: true },
        ],
        farmer: [
            { name: 'Guadaña Afilada', tier: 'Nv. 1', desc: 'La guadaña atraviesa a 1 enemigo antes de regresar.', icon: LeafIcon, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' },
            { name: 'Cosecha Magna', tier: 'Nv. 2', desc: 'El tamaño de tu guadaña aumenta un 30%.', icon: LeafIcon, color: 'text-lime-400', bg: 'bg-lime-500/20', border: 'border-lime-500/40' },
            { name: 'Doble Guadaña', tier: 'Nv. 3', desc: 'Lanza una segunda guadaña al mismo tiempo.', icon: SwordIcon, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
            { name: 'Segar Almas', tier: 'Nv. 4', desc: 'Las guadañas atraviesan enemigos de forma infinita (Pierce ∞).', icon: PixelSkullIcon, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' },
            { name: 'Cosecha Crítica', tier: 'Nv. 5+', desc: '+20% de Daño Total continuo para el late-game.', icon: PixelFireIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', ultimate: true },
        ],
    };

    const currentCharacter = CHARACTERS.find(c => c.id === selectedSkin) || CHARACTERS[0];
    const currentUpgrades = UPGRADES[selectedSkin] || [];
    const [showUpgrades, setShowUpgrades] = useState(false);

    // Reset upgrades panel when character changes
    useEffect(() => {
        setShowUpgrades(false);
    }, [selectedSkin]);

    // --- DRIVER.JS TUTORIAL ---
    const startTutorial = useCallback(() => {
        const driverObj = driver({
            popoverClass: 'misspelt-driver-popover pixel-rendering',
            showProgress: true,
            animate: true,
            doneBtnText: '¡A Jugar!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            steps: [
                {
                    element: 'body', // Sin anclaje, para el tutorial general
                    popover: {
                        title: 'Comprendiendo Misspelt',
                        description: '<img src="/placeholders/gameplay.gif" class="w-full mb-2 pixel-border" /> Escapa de las letras, asimila las palabras y sobrevive. ¡Presta atención a cómo se escriben correctamente!'
                    }
                },
                {
                    element: '#tutorial-game-heroes',
                    popover: {
                        title: 'Decide tu Forma',
                        description: 'A medida que juegas, desbloquearás nuevos personajes, cada uno con un ataque distinto que cambiará tu forma de jugar.'
                    }
                },
                {
                    element: '#tutorial-game-stats',
                    popover: {
                        title: 'Tus Estadísticas',
                        description: 'Ten cuidado. Un brujo hace mucho más daño pero muere casi con un toque. ¡Revisa sus barras de vida y velocidad!'
                    }
                },
                {
                    element: '#tutorial-game-upgrades',
                    popover: {
                        title: 'Árbol de Mejoras',
                        description: 'Al subir de nivel en la partida, desbloquearás mejoras exclusivas. ¡Revisa el árbol de habilidades de tu personaje aquí antes de empezar!'
                    }
                },
                {
                    element: '#tutorial-game-difficulty',
                    popover: {
                        title: 'El nivel del Vocabulario',
                        description: 'Esto no hace que los enemigos peguen más fuerte, sino que hace que las palabras que encuentres sean de listas mucho más complejas (y pagan mejor experiencia).'
                    }
                },
                {
                    element: '#tutorial-game-start',
                    popover: {
                        title: '¡Preparado!',
                        description: 'Una vez todo listo, comienza para sumergirte en la granja y empezar a matar palabras mal escritas.'
                    }
                }
            ],
            onDestroyStarted: () => {
                localStorage.setItem('misspelt_has_seen_game_tour', 'true');
                driverObj.destroy();
            }
        });

        driverObj.drive();
    }, []);

    useEffect(() => {
        if (gameState === 'SELECTION') {
            const hasSeenTour = localStorage.getItem('misspelt_has_seen_game_tour');
            if (!hasSeenTour) {
                setTimeout(() => {
                    startTutorial();
                }, 500);
            }
        }
    }, [gameState, startTutorial]);

    // 1. GESTIÓN DEL NAVBAR Y FETCH DE STATS
    useEffect(() => {
        const navbar = document.querySelector('nav');
        if (navbar) navbar.style.display = 'none';
        const fetchStats = async () => {
            try {
                const res = await api.get('/user-stats/me/');
                if (res.data && res.data.unlocked_characters) {
                    setUnlockedCharacters(res.data.unlocked_characters);
                }
            } catch (error) {
                console.error("Error fetching user stats for unlocked characters:", error);
            }
        };
        fetchStats();

        return () => {
            if (navbar) navbar.style.display = 'flex';
        };
    }, []);

    const [isPreparing, setIsPreparing] = useState(false);
    const handleIframeLoad = (e) => {
        const iframeWindow = e.target.contentWindow;
        if (!iframeWindow) {
            console.error("React: No se pudo acceder a la ventana del iframe.");
            return;
        }

        iframeWindow.triggerQuiz = (wordText) => {
            if (!wordText) return;
            const currentWords = sessionWordsRef.current;
            const foundWord = currentWords.find(w => {
                const txt = w.text || w.id;
                return txt && typeof txt === 'string' && txt.trim().toUpperCase() === wordText.trim().toUpperCase();
            });

            if (foundWord) {
                seenWordsRef.current.add(foundWord.id);
                setCurrentQuizWord(foundWord);
                setShowQuiz(true);
            } else {
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

        iframeWindow.handleGameOver = async (finalScore, timeSpentSeconds = 0, lettersKilled = 0, bossesKilled = 0) => {
            // Transform Set to array with word texts
            const currentWords = sessionWordsRef.current;
            const correctWordsArr = Array.from(correctWordsRef.current).map(id => currentWords.find(w => w.id === id) || id);
            const seenWordsArr = Array.from(seenWordsRef.current).map(id => currentWords.find(w => w.id === id) || id);

            setPendingGameData({
                finalScore,
                timeSpentSeconds,
                lettersKilled,
                bossesKilled,
                seen_word_ids: Array.from(seenWordsRef.current),
                correct_word_ids: Array.from(correctWordsRef.current),
                seen_words: seenWordsArr,
                correct_words: correctWordsArr
            });

            setGameState('AI_EVALUATION');
        };

        iframeWindow.onGodotExit = () => {
            setGameState('SELECTION');
        };

        iframeWindow.handleExitGame = () => {
            setGameState('SELECTION');
        };
    };

    const handleOracleComplete = async (aiEvaluationJSON) => {
        if (!pendingGameData) {
            setGameState('SELECTION');
            return;
        }

        setResults({ xp_earned: pendingGameData.finalScore, level: 1, killCount: pendingGameData.lettersKilled, ai_evaluation: aiEvaluationJSON?.evaluacion });
        setGameState('RESULTS');

        try {
            const response = await api.post('/game/submit-results/', {
                xp_earned: pendingGameData.finalScore,
                time_spent: pendingGameData.timeSpentSeconds,
                letters_killed: pendingGameData.lettersKilled,
                bosses_killed: pendingGameData.bossesKilled,
                seen_word_ids: pendingGameData.seen_word_ids,
                correct_word_ids: pendingGameData.correct_word_ids,
                score: pendingGameData.finalScore * 10,
                correct_answers: pendingGameData.correct_word_ids.length,
                total_questions: pendingGameData.seen_word_ids.length,
                game_mode: 'SURVIVOR',
                ai_evaluation: aiEvaluationJSON?.evaluacion
            });

            if (fetchUserData) await fetchUserData();

            setResults((prev) => ({
                ...prev,
                new_total_xp: response.data?.new_xp || 0,
                level: response.data?.new_level || 1,
                time_spent: response.data?.time_spent || pendingGameData.timeSpentSeconds,
                breakdown: response.data?.match_breakdown
            }));

            const finalCorrectAnswers = pendingGameData.correct_word_ids.length;
            if (finalCorrectAnswers > 0) {
                toast.success('Nuevas palabras añadidas al diccionario', {
                    description: `Has aprendido o repasado ${finalCorrectAnswers} palabra${finalCorrectAnswers === 1 ? '' : 's'}.`,
                });
            }

            if (response.data?.badges_unlocked && response.data.badges_unlocked.length > 0) {
                response.data.badges_unlocked.forEach(badge => {
                    toast('¡Insignia Desbloqueada!', {
                        description: badge.title,
                        icon: badge.image ? <img src={badge.image} alt={badge.title} className="w-8 h-8 rounded-full pixel-rendering" /> : <TrophyIcon className="w-6 h-6 text-yellow-500" />,
                        duration: 5000,
                    });
                });
            }
        } catch (error) {
            console.error("Error al guardar partida con AI Eval (API):", error);
        }
    };

    const sendToGodot = (success) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            const godotWindow = iframeRef.current.contentWindow;

            if (typeof godotWindow.godotQuizCallback === 'function') {
                godotWindow.godotQuizCallback(success);
            } else {
                console.error("React: ⚠️ No encontré 'godotQuizCallback' en el iframe.");
            }

            setTimeout(() => {
                if (iframeRef.current) {
                    iframeRef.current.focus();
                    if (iframeRef.current.contentWindow) {
                        iframeRef.current.contentWindow.focus();
                        try {
                            const godotCanvas = iframeRef.current.contentDocument.getElementById('canvas');
                            if (godotCanvas) godotCanvas.focus();
                        } catch {
                            console.warn("React: Cannot access iframe contentDocument for canvas focus");
                        }
                    }
                }
            }, 100);

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
        sendToGodot(success);
    };

    const handleQuizClose = () => {
        setShowQuiz(false);
        sendToGodot(false);
    };

    const startGame = async () => {
        if (isPreparing) return;
        setIsPreparing(true);

        try {
            const response = await api.get(`/game/quiz-words/?difficulty=${difficulty}`);
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];

            setSessionWords(data);
            sessionWordsRef.current = data;

            const wordsArray = data.map(w => w.text || "ERROR");
            setGameWordsTexts(wordsArray);

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

                                <div id="tutorial-game-heroes" className="grid grid-cols-2 gap-4 mb-6">
                                    {CHARACTERS.map((char) => {
                                        const isUnlocked = unlockedCharacters.includes(char.id);
                                        const isSelected = selectedSkin === char.id;
                                        return (
                                            <div
                                                key={char.id}
                                                onClick={() => {
                                                    if (isUnlocked) {
                                                        setSelectedSkin(char.id);
                                                    } else {
                                                        toast.info('Personaje Bloqueado', { description: char.unlockReq });
                                                    }
                                                }}
                                                className={`
                                                    relative flex flex-col items-center p-4 border-4 transition-all duration-200
                                                    ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}
                                                    ${isSelected
                                                        ? 'border-primary bg-primary/10 scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10'
                                                        : isUnlocked
                                                            ? 'border-muted bg-muted/50 hover:border-primary/50 hover:scale-105'
                                                            : 'border-muted bg-muted/20 grayscale'
                                                    }
                                                `}
                                            >
                                                {!isUnlocked && (
                                                    <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                                                        <div className="bg-background p-2 border-2 border-foreground shadow-md rounded-none">
                                                            <PixelLockIcon className="text-muted-foreground w-5 h-5" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className={`mb-2 overflow-hidden pixel-rendering ${!isUnlocked ? 'opacity-30' : ''}`}>
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
                                                <span className={`uppercase font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'} ${!isUnlocked ? 'opacity-50' : ''}`}>
                                                    {char.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Panel Derecho: Lore, Stats y Opciones */}
                            <div className="flex-1 flex flex-col justify-between bg-muted/20 border-4 border-foreground p-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-2 bg-foreground"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 bg-foreground"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 bg-foreground"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-foreground"></div>

                                <div id="tutorial-game-stats">
                                    <h3 className="text-3xl font-black text-primary uppercase mb-2 drop-shadow-sm">
                                        {currentCharacter.name}
                                    </h3>
                                    <p className="text-base font-sans text-muted-foreground italic mb-2 leading-relaxed border-l-4 border-primary pl-4">
                                        "{currentCharacter.lore}"
                                    </p>

                                    {!unlockedCharacters.includes(currentCharacter.id) && (
                                        <div className="mb-6 p-3 border-2 border-red-500/50 bg-red-500/10 flex items-start gap-3 animate-in pulse duration-1000">
                                            <PixelLockIcon className="text-red-500 shrink-0 mt-0.5 w-4 h-4" />
                                            <div>
                                                <p className="text-xs font-bold text-red-500 uppercase mb-0.5">Personaje Bloqueado</p>
                                                <p className="text-sm font-sans text-muted-foreground">{currentCharacter.unlockReq}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 mb-8 mt-4">
                                        {[
                                            { label: 'HP', value: currentCharacter.stats.hp, max: 200, color: 'bg-red-500' },
                                            { label: 'DMG', value: currentCharacter.stats.dmg, max: 20, color: 'bg-orange-500' },
                                            { label: 'SPD', value: currentCharacter.stats.spd, max: 500, color: 'bg-blue-500' },
                                        ].map(stat => {
                                            const filled = Math.round((stat.value / stat.max) * 10);
                                            return (
                                                <div key={stat.label} className="flex items-center gap-3">
                                                    <span className="font-bold text-xs uppercase w-10 text-muted-foreground">{stat.label}</span>
                                                    <div className="flex gap-1 flex-1">
                                                        {[...Array(10)].map((_, i) => (
                                                            <div
                                                                key={`${stat.label}-${i}`}
                                                                className={`w-3 h-3 border-2 border-foreground/60 transition-all duration-300 ${i < filled ? stat.color : 'bg-background'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-bold w-8 text-right text-foreground">{stat.value}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Botón para abrir el Árbol de Mejoras*/}
                                    <Button
                                        id="tutorial-game-upgrades"
                                        variant="outline"
                                        onClick={() => setShowUpgrades(true)}
                                        className="w-full mb-6 relative h-12 text-xs rounded-none font-bold uppercase pixel-btn border-2 border-accent hover:bg-accent hover:text-accent-foreground text-accent group overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                                    >
                                        <PixelSparklesIcon className="w-4 h-4 mr-2 group-hover:animate-spin" />
                                        Ver Árbol de Mejoras
                                    </Button>

                                    <div id="tutorial-game-difficulty" className="mb-6">
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
                                        <PixelArrowLeftIcon className="mr-2 w-6 h-6" /> VOLVER
                                    </Button>
                                    <Button
                                        onClick={startGame}
                                        id="tutorial-game-start"
                                        disabled={isPreparing}
                                        className={`w-full lg:w-2/3 hover:bg-accent  rounded-none h-14 text-xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-accent text-accent-foreground ${isPreparing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isPreparing ? (
                                            <>
                                                <div className="w-5 h-5 border-4 border-foreground border-t-transparent animate-spin rounded-full mr-2"></div>
                                                CARGANDO...
                                            </>
                                        ) : (
                                            <>
                                                <PixelPlayIcon className="mr-2 fill-current" /> INICIAR PARTIDA
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Upgrades Overlay */}
                                {showUpgrades && (
                                    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-200 border-4 border-accent shadow-2xl">
                                        <div className="bg-accent text-accent-foreground px-5 py-4 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <PixelSparklesIcon className="w-5 h-5 animate-pulse" />
                                                <h3 className="font-black text-lg uppercase tracking-wider drop-shadow-sm">Mejoras de {currentCharacter.name}</h3>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowUpgrades(false); }}
                                                className="hover:bg-background/20 text-accent-foreground p-1.5 transition-colors border-2 border-transparent hover:border-accent-foreground shadow-sm hover:shadow-md"
                                                title="Cerrar"
                                            >
                                                <span className="font-mono text-xl font-black block px-1 leading-none">X</span>
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar scroll-smooth">
                                            <div className="relative before:absolute before:inset-y-4 before:left-[34px] before:w-1 before:bg-accent/20 space-y-3">
                                                {currentUpgrades.map((upg, idx) => (
                                                    <div
                                                        key={upg.name}
                                                        className={`relative pl-14 pr-3 py-1  flex flex-col justify-center min-h-[4rem] animate-in slide-in-from-right-4 fade-in duration-300`}
                                                        style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                                                    >
                                                        {/* Timeline Node */}
                                                        <div className={`absolute  left-[29px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-none border-2 border-background rotate-45 z-10 ${upg.ultimate ? 'bg-yellow-400 scale-150 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-accent'}`} />

                                                        {/* Content Card */}
                                                        <div className={`flex text-base items-start  gap-4 p-3 border-2 ${upg.border} ${upg.bg} w-full shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5 relative group bg-background/50 backdrop-blur-sm`}>
                                                            <div className="flex flex-col items-center justify-center gap-1 w-8 shrink-0">
                                                                <div className="w-8 h-8 group-hover:scale-110 transition-transform flex items-center justify-center">
                                                                    {upg.icon ? <upg.icon className="w-full h-full drop-shadow-sm" /> : <span className="text-2xl drop-shadow-sm">{upg.emoji}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center flex-wrap gap-2 mb-1.5 line-clamp-1">
                                                                    <span
                                                                        className={`font-black ml-0.5 text-base uppercase drop-shadow-md ${upg.color}`}
                                                                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.4), 1px -1px 0 rgba(0,0,0,0.4), -1px 1px 0 rgba(0,0,0,0.4)' }}
                                                                    >
                                                                        {upg.name}
                                                                    </span>
                                                                    <span className={`text-[12px] font-black uppercase px-1.5 py-0.5 border ${upg.ultimate ? 'bg-yellow-500/20  border-yellow-500/50' : 'bg-foreground/10 border-foreground/30 text-foreground'}`}>
                                                                        {upg.tier}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xm text-muted-foreground leading-relaxed font-sans">{upg.desc}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-muted/40 text-center text-[16px] text-muted-foreground uppercase border-t-2 border-accent/20">
                                            Asciende de nivel en la partida para desbloquear estas habilidades
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Floating Tutorial Button */}
                    <button
                        onClick={startTutorial}
                        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-accent-foreground pixel-border flex items-center justify-center text-2xl hover:scale-110 transition-transform z-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                        title="Ver Tutorial de Nuevo"
                    >
                        <span className="font-mono text-3xl pb-1">?</span>
                    </button>
                </div>
            )}

            {/* VISTA B: GAME RUNNING */}
            {gameState === 'PLAYING' && (
                <div className="relative w-full h-full bg-black flex flex-col">

                    <iframe
                        ref={iframeRef}
                        src={`/game/index.html?skin=${selectedSkin}&difficulty=${difficulty === 'EASY' ? 1 : difficulty === 'NORMAL' ? 2 : 3}&words=${gameWordsTexts.join(',')}`}
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

            {/* VISTA A.5: ORACLE CHAT */}
            {gameState === 'AI_EVALUATION' && pendingGameData && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
                    <OracleChat
                        characterId={selectedSkin}
                        results={pendingGameData}
                        onComplete={handleOracleComplete}
                        userName={user?.username || 'Jugador'}
                    />
                </div>
            )}

            {/* VISTA C: RESULTADOS */}
            {gameState === 'RESULTS' && results && (() => {
                const totalQuestions = Array.from(seenWordsRef.current).length;
                const correctAnswers = Array.from(correctWordsRef.current).length;
                const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                const accColor = accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500';

                const formatTime = (s) => {
                    if (!s) return '0:00';
                    const mins = Math.floor(s / 60);
                    const secs = Math.floor(s % 60);
                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                };

                const breakdown = results.breakdown;

                return (
                    <div className="flex flex-col items-center justify-center h-full animate-in rounded-none fade-in zoom-in duration-300 p-4">
                        <Card className="w-full max-w-2xl rounded-none border-4 border-primary bg-background p-0 overflow-hidden">
                            {/* Header */}
                            <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-center gap-3 border-b-4 border-foreground">
                                <TrophyIcon className="w-8 h-8 animate-bounce" />
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider">Resumen de Partida</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Main Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                                        <PixelStarIcon className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">XP Ganada</p>
                                        <p className="text-2xl font-black text-primary">+{results.xp_earned}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                                        <TrophyIcon className="w-5 h-5 text-primary mx-auto mb-1" />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Nivel</p>
                                        <p className="text-2xl font-black text-foreground">{results.level}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                                        <PixelClockIcon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Tiempo</p>
                                        <p className="text-2xl font-black text-foreground">{formatTime(results.time_spent)}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                                        <PixelTargetIcon className="w-5 h-5 text-red-500 mx-auto mb-1" />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Precisión</p>
                                        <p className={`text-2xl font-black ${accColor}`}>{accuracy}%</p>
                                    </div>
                                </div>

                                {/* Combat Stats */}
                                <div className="bg-muted/20 border-2 border-foreground/20 p-4">
                                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-wider"><SwordIcon className="w-3 h-3" /> Combate</p>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-xl font-black text-foreground">{correctAnswers}/{totalQuestions}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Preguntas</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-foreground">{results.breakdown?.seen?.SLANG ? Object.values(results.breakdown.seen).reduce((a, b) => a + b, 0) : 0}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Letras Vistas</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-foreground">{results.killCount}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">Palabras Asesinadas</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Word Breakdown */}
                                {breakdown && (
                                    <div className="bg-muted/20 border-2 border-foreground/20 p-4">
                                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-wider"><BookIcon className="w-3 h-3" /> Desglose por tipo</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {[
                                                { label: 'Slangs', key: 'SLANG', color: 'text-yellow-500' },
                                                { label: 'Idioms', key: 'IDIOM', color: 'text-purple-500' },
                                                { label: 'P. Verbs', key: 'PHRASAL_VERB', color: 'text-blue-500' },
                                                { label: 'Vocab', key: 'VOCABULARY', color: 'text-emerald-500' },
                                            ].map(cat => (
                                                <div key={cat.key} className="text-center p-2 bg-background border border-foreground/10">
                                                    <p className={`text-lg font-black ${cat.color}`}>
                                                        {breakdown.correct?.[cat.key] || 0}/{breakdown.seen?.[cat.key] || 0}
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground uppercase">{cat.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        onClick={() => setGameState('SELECTION')}
                                        className="flex-1 h-12 text-base pixel-btn rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    >
                                        <PixelRestartIcon className="mr-2 w-5 h-5" /> JUGAR DE NUEVO
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/')}
                                        className="flex-1 h-12 text-base pixel-btn rounded-none border-2 border-foreground hover:bg-muted"
                                    >
                                        <PixelHomeIcon className="mr-2 w-5 h-5" /> IR AL HOME
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })()}
        </div>
    );
};

export default GamePage;