import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import useAxios from '@/utils/useAxios';

// UI Components
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Trophy, Clock, Star, Home, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import SpriteAnimator from '@/components/ui/SpriteAnimator';

const GamePage = () => {
    const navigate = useNavigate();
    const api = useAxios();
    const { user, fetchUserData } = useContext(AuthContext);


    // --- MÁQUINA DE ESTADOS ---
    // 'SELECTION' | 'PLAYING' | 'RESULTS'
    const [gameState, setGameState] = useState('SELECTION');
    const [results, setResults] = useState(null);
    const [selectedSkin, setSelectedSkin] = useState('mage'); // Default selection
    const [gameWords, setGameWords] = useState([]);

    // Personajes disponibles
    const CHARACTERS = [
        { id: 'mage', name: 'Mage', sprite: '/game/skins/mage.png' },
        { id: 'farmer', name: 'Farmer', sprite: '/game/skins/mage.png' }, // Placeholder
        { id: 'warlock', name: 'Warlock', sprite: '/game/skins/mage.png' }, // Placeholder
        { id: 'erudit', name: 'Erudit', sprite: '/game/skins/mage.png' }, // Placeholder
    ];

    useEffect(() => {
        const navbar = document.getElementById('main-navbar');
        if (navbar) {
            if (gameState === 'PLAYING') {
                navbar.style.display = 'none';
            } else {
                navbar.style.display = ''; // Remove inline style so CSS classes take effect
            }
        }

        return () => {
            if (navbar) navbar.style.display = ''; // Ensure visible on unmount
        };
    }, [gameState]);

    useEffect(() => {
        const prepareGame = async () => {
            try {
                const response = await api.get('/game/quiz-words/');
                const wordsArray = response.data.map(w => w.english_word);
                setGameWords(wordsArray);
            } catch (error) {
                console.error("Error cargando palabras:", error);
                setGameWords(["ERROR", "CHECK", "API"]);
            }
        };
        prepareGame();
    }, [api]);



    useEffect(() => {
        window.onGodotGameOver = async (xpEarned, wordsIds) => {
            try {
                const response = await api.post('/game/submit-results/', {
                    xp_earned: xpEarned,
                    seen_word_ids: wordsIds,
                    score: xpEarned * 10, // Estimación temporal si Godot no envía el score
                    correct_answers: Math.floor(xpEarned / 10), // Estimación temporal
                    total_questions: 10 // Estimación temporal
                });

                if (fetchUserData) await fetchUserData();

                setResults({
                    xp_earned: xpEarned,
                    new_total_xp: response.data.new_xp,
                    level: response.data.new_level
                });
                setGameState('RESULTS');

            } catch (error) {
                console.error("Error al guardar partida:", error);
            }
        };

        window.onGodotExit = () => {
            console.log("🚪 Godot solicitó salir del juego.");
            setGameState('SELECTION');
        };

        return () => {
            delete window.onGodotGameOver;
            delete window.onGodotExit;
        };
    }, [api, fetchUserData]);

    return (
        <div className="w-full h-screen bg-background text-foreground overflow-hidden font-pixel">

            {/* VISTA A: MENÚ DE SELECCIÓN */}
            {gameState === 'SELECTION' && (
                <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
                    <h1 className="text-4xl md:text-6xl text-center font-black text-primary drop-shadow-pixel">
                        MISSPELT SURVIVOR
                    </h1>

                    <Card className=" border-primary bg-background p-6 pixel-border w-full max-w-4xl rounded-none">
                        <h2 className="text-2xl font-bold uppercase text-center mb-6">Elige tu Héroe</h2>

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
                                        <div className="mb-2 overflow-hidden">
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
                                    </div>
                                );
                            })}
                        </div>

                        <Button
                            onClick={() => setGameState('PLAYING')}
                            className="w-full h-16 text-2xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <Play className="mr-2 fill-current" /> ¡JUGAR!
                        </Button>
                    </Card>
                </div>
            )}

            {/* VISTA B: GAME RUNNING */}
            {gameState === 'PLAYING' && (
                <div className="relative w-full h-full bg-black">
                    <iframe
                        src={`/game/index.html?skin=${selectedSkin}`}
                        className="w-full h-full border-none"
                        title="Godot Game"
                    />
                    {/* Botón de pánico/salida rápida */}
                    <button
                        onClick={() => setGameState('SELECTION')}
                        className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors"
                    >
                        <ArrowLeft />
                    </button>
                </div>
            )}

            {/* VISTA C: RESULTADOS */}
            {gameState === 'RESULTS' && results && (
                <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300">
                    <Card className="w-full max-w-lg border-8 border-double border-primary p-8 text-center space-y-8">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto" />
                        <h2 className="text-4xl font-bold uppercase italic">Resumen de Partida</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted p-4 border-4 border-muted-foreground">
                                <Star className="text-primary mx-auto mb-2" />
                                <p className="text-sm uppercase font-bold text-muted-foreground">XP Ganada</p>
                                <p className="text-3xl font-black">+{results.xp_earned}</p>
                            </div>
                            <div className="bg-muted p-4 border-4 border-muted-foreground">
                                <Trophy className="text-primary mx-auto mb-2" />
                                <p className="text-sm uppercase font-bold text-muted-foreground">Nivel Actual</p>
                                <p className="text-3xl font-black">{results.level}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                onClick={() => setGameState('SELECTION')}
                                className="h-14 text-xl"
                            >
                                <RotateCcw className="mr-2" /> VOLVER AL MENÚ
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="h-14 text-xl"
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