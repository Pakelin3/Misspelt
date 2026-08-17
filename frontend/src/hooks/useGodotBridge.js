import { useCallback, useRef, useState } from 'react';

/**
 * Encapsula el puente JS entre React y el iframe de Godot: las funciones que
 * el motor invoca directamente sobre `iframe.contentWindow`
 * (`triggerQuiz`, `handleGameOver`, `onGodotExit`, `handleExitGame`,
 * `handleTutorialComplete`) y el camino inverso (`sendToGodot`, que llama a
 * `godotQuizCallback` dentro del iframe).
 *
 * Los refs (`sessionWordsRef`, `seenWordsRef`, `correctWordsRef`) existen
 * porque las funciones inyectadas en `iframeWindow` se crean una sola vez en
 * `onLoad` y quedarian con clausuras obsoletas si leyeran estado de React
 * directamente; por eso se leen/mutan a traves de refs en vez de depender de
 * los valores capturados en el momento del `onLoad`.
 */
const useGodotBridge = ({ setPendingGameData, setGameState, setIsTutorial }) => {
    const iframeRef = useRef(null);
    const sessionWordsRef = useRef([]);
    const seenWordsRef = useRef(new Set());
    const correctWordsRef = useRef(new Set());

    const [currentQuizWord, setCurrentQuizWord] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);

    const handleIframeLoad = useCallback((e) => {
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
            setIsTutorial(false);
            setGameState('SELECTION');
        };

        iframeWindow.handleTutorialComplete = () => {
            setIsTutorial(false);
            setGameState('SELECTION');
        };
    }, [setPendingGameData, setGameState, setIsTutorial]);

    const sendToGodot = useCallback((success) => {
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
    }, []);

    const handleQuizComplete = useCallback((score) => {
        setShowQuiz(false);
        const success = score > 0;
        if (success && currentQuizWord) {
            correctWordsRef.current.add(currentQuizWord.id);
        }
        sendToGodot(success);
    }, [currentQuizWord, sendToGodot]);

    const handleQuizClose = useCallback(() => {
        setShowQuiz(false);
        sendToGodot(false);
    }, [sendToGodot]);

    return {
        iframeRef,
        sessionWordsRef,
        seenWordsRef,
        correctWordsRef,
        currentQuizWord,
        showQuiz,
        handleIframeLoad,
        handleQuizComplete,
        handleQuizClose,
    };
};

export default useGodotBridge;
