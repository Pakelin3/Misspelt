import { useCallback, useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/**
 * Tutorial guiado con driver.js que se muestra la primera vez que el jugador
 * entra a la pantalla de seleccion (marcado con localStorage) y que tambien
 * puede relanzarse a mano desde el boton flotante "?".
 */
const useGameTutorial = (gameState) => {
    const startTutorial = useCallback(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const driverObj = driver({
            popoverClass: 'misspelt-driver-popover pixel-rendering',
            showProgress: true,
            animate: !prefersReducedMotion,
            doneBtnText: '¡A Jugar!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            steps: [
                {
                    element: 'body', // Sin anclaje, para el tutorial general
                    popover: {
                        title: 'Comprendiendo Misspelt',
                        description: 'Escapa de las letras, asimila las palabras y sobrevive. ¡Presta atención a cómo se escriben correctamente!'
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

    return startTutorial;
};

export default useGameTutorial;
