import React, { useEffect } from 'react';
import useAxios from '../utils/useAxios';

const GamePage = () => {
    const api = useAxios();

    useEffect(() => {
        window.onGodotGameOver = async (xpEarned, wordsSeenIds) => {
            console.log("🎮 ¡Mensaje recibido desde Godot!");
            console.log(`XP Ganada: ${xpEarned}, Palabras Vistas:`, wordsSeenIds);

            try {
                const response = await api.post('/api/submit-game/', {
                    experience_gained: xpEarned,
                    seen_word_ids: wordsSeenIds
                });

                console.log("✅ Progreso guardado en la Base de Datos:", response.data);
                alert(`¡Has ganado ${xpEarned} XP!`);

            } catch (error) {
                console.error("❌ Error guardando progreso del juego:", error);
            }
        };

        return () => {
            delete window.onGodotGameOver;
        };
    }, [api]);

    return (
        <div className="w-full h-screen bg-black flex justify-center items-center overflow-hidden">
            <iframe
                src="/game/index.html"
                className="w-full h-full border-none"
                title="Misspelt Survivor Game"
                allow="fullscreen"
            />
        </div>
    );
};

export default GamePage;