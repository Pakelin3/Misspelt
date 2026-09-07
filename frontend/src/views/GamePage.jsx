import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import useAxios from '@/utils/useAxios';
import { toast } from 'sonner';
import { TrophyIcon, PixelArrowLeftIcon } from '@/components/PixelIcons';
import heroBg from "@/img/background.jpg";
import { Button } from '@/components/ui/Button';
import QuizManager from '@/components/quiz/QuizManager';
import OracleChat from '@/components/game/OracleChat';
import CharacterSelection from '@/components/game/CharacterSelection';
import GameResults from '@/components/game/GameResults';
import useGamePreload from '@/hooks/useGamePreload';
import usePointerCapabilities from '@/hooks/usePointerCapabilities';
import useGodotBridge from '@/hooks/useGodotBridge';
import useGameTutorial from '@/hooks/useGameTutorial';
import usePageTitle from '@/hooks/usePageTitle';
import normalizarUrlDeMedia from '@/utils/mediaUrl';

const GamePage = () => {
    usePageTitle('Jugar');
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
    const [isTutorial, setIsTutorial] = useState(false);

    // --- ESTADOS DEL QUIZ ---
    const [sessionWords, setSessionWords] = useState([]);
    const [gameWordsTexts, setGameWordsTexts] = useState([]);

    const {
        iframeRef,
        sessionWordsRef,
        seenWordsRef,
        correctWordsRef,
        currentQuizWord,
        showQuiz,
        handleIframeLoad,
        handleQuizComplete,
        handleQuizClose,
    } = useGodotBridge({ setPendingGameData, setGameState, setIsTutorial });

    const startTutorial = useGameTutorial(gameState);

    // 1. GESTIÓN DEL NAVBAR (se oculta mientras se juega, es exclusiva de esta vista)
    useEffect(() => {
        const navbar = document.querySelector('nav');
        if (navbar) navbar.style.display = 'none';

        return () => {
            if (navbar) navbar.style.display = 'flex';
        };
    }, []);

    // 2. FETCH DE PERSONAJES DESBLOQUEADOS. Solo debe pedirse una vez al
    // entrar a la vista; el ref evita repetir la llamada si `api` cambia de
    // identidad (por ejemplo tras un refresh de token) sin reintroducir el
    // eslint-disable que había antes sobre la dependencia de `api`.
    const hasFetchedStatsRef = useRef(false);
    useEffect(() => {
        if (hasFetchedStatsRef.current) return;
        hasFetchedStatsRef.current = true;

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
    }, [api]);

    const [isPreparing, setIsPreparing] = useState(false);
    const [iframeFailed, setIframeFailed] = useState(false);
    // Antes, si `/game/quiz-words/` fallaba, se mandaba ["ERROR","FALLBACK"]
    // al juego como si fueran palabras reales: el alumno las deletreaba y el
    // quiz mostraba "Definición no disponible." como si fuera contenido del
    // curso. Un fallo de red no es un estado vacío: se muestra como error.
    const [wordsLoadError, setWordsLoadError] = useState(false);

    const { isTouchOnly } = usePointerCapabilities();
    // Se precarga mientras el jugador elige personaje, no al pulsar jugar.
    const { progress: preloadProgress, status: preloadStatus } = useGamePreload(
        gameState === 'SELECTION' && !isTouchOnly,
    );

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
                        icon: badge.image ? <img src={normalizarUrlDeMedia(badge.image)} alt="" aria-hidden="true" width="32" height="32" loading="lazy" className="w-8 h-8 rounded-full pixel-rendering" /> : <TrophyIcon aria-hidden="true" className="w-6 h-6 text-accent-strong" />,
                        duration: 5000,
                    });
                });
            }
        } catch (error) {
            console.error("Error al guardar partida con AI Eval (API):", error);
        }
    };

    const startGame = async () => {
        if (isPreparing) return;
        setIsPreparing(true);
        setWordsLoadError(false);

        try {
            const response = await api.get(`/game/quiz-words/?difficulty=${difficulty}`);
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];

            // Sin palabras no hay partida que evaluar: mejor cortar aquí con
            // un error claro que dejar que Godot deletree contenido inventado.
            if (data.length === 0) {
                throw new Error('El backend no devolvió palabras para esta dificultad.');
            }

            // Una palabra sin `text` se descarta, no se rellena con "ERROR": el
            // relleno acababa en el juego como una palabra a deletrear, y el
            // alumno practicaba literalmente la palabra ERROR creyendo que era
            // contenido del curso. Si no queda ninguna utilizable, es un fallo,
            // no una partida vacia.
            const utilizables = data.filter((w) => Boolean(w.text));
            if (utilizables.length === 0) {
                throw new Error('Las palabras que devolvió el backend no son utilizables.');
            }

            // La misma lista para las dos cosas: `sessionWordsRef` es donde
            // useGodotBridge busca la definicion de la palabra que Godot acaba
            // de completar, asi que si contuviera entradas que no viajaron al
            // juego, la busqueda podria emparejar algo que el jugador no vio.
            setSessionWords(utilizables);
            sessionWordsRef.current = utilizables;
            setGameWordsTexts(utilizables.map((w) => w.text));

            setGameState('PLAYING');
        } catch (error) {
            console.error("Error cargando palabras antes de iniciar:", error);
            setWordsLoadError(true);
        } finally {
            setIsPreparing(false);
        }
    };

    const startTutorialGame = () => {
        setIsTutorial(true);
        setGameState('PLAYING');
    };

    return (
        <main id="main-content" className="w-full h-screen bg-background text-foreground overflow-hidden font-mono">
            {/* VISTA A: MENÚ DE SELECCIÓN */}
            {gameState === 'SELECTION' && (
                <div className="relative w-full h-full">
                    <CharacterSelection
                        navigate={navigate}
                        selectedSkin={selectedSkin}
                        setSelectedSkin={setSelectedSkin}
                        unlockedCharacters={unlockedCharacters}
                        difficulty={difficulty}
                        setDifficulty={setDifficulty}
                        isPreparing={isPreparing}
                        startGame={startGame}
                        startTutorialGame={startTutorialGame}
                        startTutorial={startTutorial}
                        isTouchOnly={isTouchOnly}
                        preloadProgress={preloadProgress}
                        preloadStatus={preloadStatus}
                    />

                    {/* Antes esto se disfrazaba de partida jugable con
                        ["ERROR","FALLBACK"] como palabras. Un fallo de red se
                        muestra como error real, no como estado vacío. */}
                    {wordsLoadError && (
                        <div className="absolute inset-0 z-modal flex items-center justify-center bg-background/95 p-6">
                            <div role="alert" className="bg-card text-card-foreground pixel-border p-8 max-w-md text-center space-y-4">
                                <h2 className="font-mono text-lg uppercase text-destructive">No se pudieron cargar las palabras</h2>
                                <p className="font-sans text-lg text-muted-foreground">
                                    Puede ser tu conexión con el servidor. Vuelve a intentarlo antes de empezar la partida.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button onClick={startGame} disabled={isPreparing}>
                                        Reintentar
                                    </Button>
                                    <Button variant="outline" onClick={() => setWordsLoadError(false)}>
                                        Cerrar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* VISTA B: GAME RUNNING */}
            {gameState === 'PLAYING' && (
                // bg-black deliberado, no un color de tema: es el letterbox del canvas del juego.
                <div className="relative w-full h-full bg-black flex flex-col">

                    <button
                        type="button"
                        onClick={() => { setIsTutorial(false); setGameState('SELECTION'); }}
                        aria-label="Salir del juego"
                        className="absolute top-3 right-3 z-modal-nested flex min-h-11 items-center gap-2 border-2 border-background bg-background/80 px-3 py-2 font-mono text-3xs uppercase text-foreground backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <PixelArrowLeftIcon aria-hidden="true" className="w-4 h-4" />
                        Salir
                    </button>

                    <iframe
                        ref={iframeRef}
                        src={isTutorial
                            ? `/game/index.html?skin=mage&mode=tutorial`
                            // `words` va como un array JSON codificado con encodeURIComponent, no
                            // como texto separado por comas: una palabra del diccionario con '&',
                            // '=' o ',' (p. ej. "rock & roll", "M&M") cortaba la query string ahí
                            // y perdía el resto de la lista. GameManager.gd decodifica con
                            // URLSearchParams (que hace bien el %-decoding) y parsea el JSON con
                            // JSON.parse_string; los dos lados cambian juntos.
                            : `/game/index.html?skin=${encodeURIComponent(selectedSkin)}&difficulty=${difficulty === 'EASY' ? 1 : difficulty === 'NORMAL' ? 2 : 3}&words=${encodeURIComponent(JSON.stringify(gameWordsTexts))}`
                        }
                        onLoad={handleIframeLoad}
                        onError={() => setIframeFailed(true)}
                        className="w-full h-full border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 block"
                        title="Misspelt Survivor"
                        allow="autoplay; fullscreen; clipboard-write"
                    />

                    {/* Antes, si el iframe no cargaba, el jugador se quedaba
                        mirando negro para siempre sin ninguna salida. */}
                    {iframeFailed && (
                        <div className="absolute inset-0 z-modal flex items-center justify-center bg-background/95 p-6">
                            <div role="alert" className="bg-card text-card-foreground pixel-border p-8 max-w-md text-center space-y-4">
                                <h2 className="font-mono text-lg uppercase text-destructive">El juego no pudo cargar</h2>
                                <p className="font-sans text-lg text-muted-foreground">
                                    Puede ser tu conexión. Vuelve a intentarlo o practica con el quiz mientras tanto.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button onClick={() => { setIframeFailed(false); setGameState('SELECTION'); }}>
                                        Volver a intentarlo
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate('/quiz')}>
                                        Ir al quiz
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL DEL QUIZ */}
                    {showQuiz && currentQuizWord && (
                        <div className="absolute inset-0 z-modal flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4 motion-safe:animate-in motion-safe:fade-in duration-300">
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
                <div className="fixed inset-0 z-modal flex items-center justify-center bg-black overflow-hidden">
                    <img
                        src={heroBg}
                        alt="Paisaje en pixel art"
                        className="absolute inset-0 w-full h-full object-cover pixel-rendering opacity-30 pointer-events-none"
                    />
                    <div className="relative z-10 w-full max-w-4xl h-[90dvh] p-4 flex items-center justify-center">
                        <OracleChat
                            className="w-full h-full"
                            characterId={selectedSkin}
                            results={pendingGameData}
                            onComplete={handleOracleComplete}
                            userName={user?.username || 'Jugador'}
                        />
                    </div>

                </div>
            )}

            {/* VISTA C: RESULTADOS */}
            {gameState === 'RESULTS' && results && (
                <GameResults
                    results={results}
                    seenWordsRef={seenWordsRef}
                    correctWordsRef={correctWordsRef}
                    onPlayAgain={() => setGameState('SELECTION')}
                    onGoHome={() => navigate('/')}
                />
            )}
        </main>
    );
};

export default GamePage;
