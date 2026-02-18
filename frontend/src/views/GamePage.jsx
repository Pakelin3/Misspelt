import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import useAxios from '@/utils/useAxios';

// UI Components
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Trophy, Clock, Star, Home, Play, RotateCcw, ArrowLeft } from 'lucide-react';

const GamePage = () => {
    const navigate = useNavigate();
    const api = useAxios();
    const { user, fetchUserData } = useContext(AuthContext);

    // --- MÁQUINA DE ESTADOS ---
    // 'SELECTION' | 'PLAYING' | 'RESULTS'
    const [gameState, setGameState] = useState('SELECTION');
    const [results, setResults] = useState(null);

    // 1. Efecto para ocultar el Navbar de la App
    useEffect(() => {
        const navbar = document.getElementById('main-navbar');
        if (navbar) navbar.style.display = 'none';

        return () => {
            if (navbar) navbar.style.display = 'flex'; // O el display original
        };
    }, []);

    // 2. Escuchar a Godot (Game Over y Exit)
    useEffect(() => {
        // --- Game OVER ---
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

        // --- Exit Request ---
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
                    <h1 className="text-4xl md:text-6xl font-black text-primary drop-shadow-pixel">
                        MISSPELT SURVIVOR
                    </h1>

                    <Card className="p-6 border-4 border-primary bg-card w-full max-w-md">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-32 h-32 bg-muted rounded-lg border-4 border-dashed border-muted-foreground flex items-center justify-center">
                                {/* Aquí iría el sprite del mago seleccionado */}
                                <img src="/frontend/public/game/skins/mage.png" alt="Mago" className="pixel-art scale-150" />
                            </div>
                            <h2 className="text-2xl font-bold uppercase">The Word Wizard</h2>
                            <Button
                                onClick={() => setGameState('PLAYING')}
                                className="w-full h-16 text-2xl pixel-btn shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <Play className="mr-2 fill-current" /> ¡JUGAR!
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* VISTA B: GAME RUNNING */}
            {gameState === 'PLAYING' && (
                <div className="relative w-full h-full bg-black">
                    <iframe
                        src="/game/index.html"
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