import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import { useSpring, animated } from 'react-spring';
import { ScaleLoader } from 'react-spinners';
import { useTheme } from '@/context/ThemeContext';

const baseURL = import.meta.env.VITE_BACKEND_URL_API;
const MINIMUM_LOADING_TIME = 2000;

function RandomWordCard() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const [displayedWord, setDisplayedWord] = useState(null);
    const [randomExample, setRandomExample] = useState(null);

    const displayedWordRef = useRef(displayedWord);
    useEffect(() => {
        displayedWordRef.current = displayedWord;
    }, [displayedWord]);

    const [props, api] = useSpring(() => ({
        from: { opacity: 0, transform: 'translateY(20px)' },
        config: { duration: 500 }
    }));

    const fetchRandomWord = useCallback(async () => {
        setLoading(true);
        setError(null);
        const startTime = Date.now();

        let fetchedWordData = null;
        let fetchedRandomExample = null;
        let specificFetchError = null;

        try {
            const response = await axios.get(`${baseURL}/words/random/`);
            const newWordFromServer = response.data;

            if (newWordFromServer && Object.keys(newWordFromServer).length > 0) {
                fetchedWordData = newWordFromServer;
                if (fetchedWordData.examples && fetchedWordData.examples.length > 0) {
                    fetchedRandomExample = fetchedWordData.examples[Math.floor(Math.random() * fetchedWordData.examples.length)];
                }
            } else {
                specificFetchError = "No hay palabras disponibles para mostrar";
            }
        } catch (err) {
            console.error("Error fetching random word:", err);
            specificFetchError = "No se pudo cargar la palabra. Inténtalo de nuevo más tarde";
        }

        const elapsedTime = Date.now() - startTime;
        const remainingTime = MINIMUM_LOADING_TIME - elapsedTime;
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        if (displayedWordRef.current && !specificFetchError) {
            await new Promise(resolve => {
                api.start({
                    opacity: 0,
                    transform: 'translateY(-20px)',
                    onRest: () => resolve(),
                    config: { duration: 500 }
                });
            });
        }

        if (specificFetchError) {
            setError(specificFetchError);
            setDisplayedWord(null);
            setRandomExample(null);
        } else {
            setDisplayedWord(fetchedWordData);
            setRandomExample(fetchedRandomExample);
        }

        setLoading(false);
        setInitialLoad(false);

        if (!specificFetchError && fetchedWordData) {
            api.start({
                from: { opacity: 0, transform: 'translateY(20px)' },
                to: { opacity: 1, transform: 'translateY(0px)' },
                reset: true,
                config: { duration: 500 }
            });
        }
    }, [api]);

    useEffect(() => {
        fetchRandomWord();
        const intervalId = setInterval(() => {
            fetchRandomWord();
        }, 15000);
        return () => clearInterval(intervalId);
    }, [fetchRandomWord]);

    if (initialLoad && loading) {
        return (
            <div className="flex justify-center items-center min-h-[180px] bg-[var(--color-bg-card)]">
                <div className="flex flex-col items-center justify-center">
                    <ScaleLoader
                        className="min-w-[398px] justify-center "
                        color={theme === 'light' ? 'var(--color-bg-tertiary' : 'var(--color-bg-secondary)'}
                        loading={true}
                        size={50}
                        aria-label="Cargando palabra"
                    />
                    <p className="text-[var(--color-text-secondary)] mt-3 text-lg">Cargando palabra...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center min-h-[180px] flex items-center justify-center bg-[var(--color-bg-card)]">
                <p>{error}</p>
            </div>
        );
    }

    if (displayedWord) {
        const getSpanishWordType = (type) => {
            switch (type) {
                case 'PHRASAL_VERB':
                    return 'Verbo frasal';
                case 'SLANG':
                    return 'Jerga';
                default:
                    return 'Desconocido';
            }
        };

        return (
            <animated.div
                style={props}

                className="block max-w-md bg-[var(--color-bg-card)] rounded-lg min-h-[180px]"
            >
                <div className='flex justify-between items-start min-w-full mb-4'>
                    <h5 className="mb-2 text-2xl font-bold tracking-tight text-[var(--color-text-main)]">
                        {displayedWord.text}
                    </h5>
                    <span className={`font-normal text-nowrap text-sm py-1 px-3 rounded-full transition-colors
                                ${displayedWord.word_type === "PHRASAL_VERB"
                            ? "bg-[var(--color-accent-phrasalverbs)] text-[var(--color-bg-body)]"
                            : "bg-[var(--color-accent-slangs)] text-[var(--color-bg-body)]"
                        } dark:${displayedWord.word_type === "PHRASAL_VERB"
                            ? "bg-[var(--color-accent-phrasalverbs)] text-black"
                            : "bg-[var(--color-accent-slangs)] text-white"
                        }`}
                    >
                        {getSpanishWordType(displayedWord.word_type)}
                    </span>
                </div>
                <p className="font-normal text-[var(--color-text-main)]">
                    {displayedWord.definition}
                    {randomExample && (
                        <span className="block mt-10 italic text-[var(--color-text-secondary)]">
                            Ejemplo: "{randomExample}"
                        </span>
                    )}
                </p>
            </animated.div>
        );
    }

    return (
        <div className="text-[var(--color-text-secondary)] text-center min-h-[180px] flex items-center justify-center bg-[var(--color-bg-card)]">
            <p>No hay palabras disponibles para mostrar.</p>
        </div>
    );
}

export default RandomWordCard;