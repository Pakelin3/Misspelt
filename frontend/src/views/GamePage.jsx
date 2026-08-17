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
                        icon: badge.image ? <img src={badge.image} alt="" aria-hidden="true" width="32" height="32" loading="lazy" className="w-8 h-8 rounded-full pixel-rendering" /> : <TrophyIcon aria-hidden="true" className="w-6 h-6 text-accent-strong" />,
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

    const startTutorialGame = () => {
        setIsTutorial(true);
        setGameState('PLAYING');
    };

    return (
        <div className="w-full h-screen bg-background text-foreground overflow-hidden font-mono">
            {/* VISTA A: MENÚ DE SELECCIÓN */}
            {gameState === 'SELECTION' && (
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
                            : `/game/index.html?skin=${selectedSkin}&difficulty=${difficulty === 'EASY' ? 1 : difficulty === 'NORMAL' ? 2 : 3}&words=${gameWordsTexts.join(',')}`
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
                        alt="Pixel Art Landscape"
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
        </div>
    );
};

export default GamePage;
