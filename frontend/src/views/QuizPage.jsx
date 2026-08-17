import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import useAxios from '@/utils/useAxios';
import QuizManager from '@/components/quiz/QuizManager';
import { Button } from '@/components/ui/Button';
import { Home, RotateCw } from 'lucide-react';

const QuizPage = () => {
    const [{ sessionWords, allWords, loading, loadError, finishing }, setState] = useState({
        sessionWords: [],
        allWords: [],
        loading: true,
        loadError: false,
        finishing: false,
    });
    const api = useAxios();
    const navigate = useNavigate();
    const location = useLocation();

    const fetchQuizWords = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, loadError: false }));
        try {
            const response = await api.get('/game/quiz-words/?discovered=true');
            const data = Array.isArray(response.data) ? response.data : response.data.results || [];

            let currentSessionWords = data;
            let currentAllWords = data;
            const selectedWord = location.state?.selectedWord;

            if (selectedWord) {
                // Put the selected word first
                const otherWords = data.filter(w => w.id !== selectedWord.id);
                currentSessionWords = [selectedWord, ...otherWords];
                currentAllWords = [selectedWord, ...otherWords];
            }

            setState({ sessionWords: currentSessionWords, allWords: currentAllWords, loading: false, loadError: false, finishing: false });
        } catch (error) {
            console.error("Error loading quiz words:", error);
            // Una petición fallida (red o sesión caducada) no es lo mismo que
            // "no hay palabras": el usuario necesita saber que puede reintentar.
            setState(prev => ({ ...prev, loading: false, loadError: true }));
        }
    }, [api, location.state]);

    useEffect(() => {
        fetchQuizWords();
    }, [fetchQuizWords]);

    const handleQuizComplete = () => {
        setState(prev => ({ ...prev, finishing: true }));
        toast.info('¡Desafío completado! Volviendo al inicio…');
        setTimeout(() => {
            navigate('/');
        }, 1500);
    };

    const handleQuizClose = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div role="status" aria-live="polite" className="flex flex-col items-center">
                    <div aria-hidden="true" className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4"></div>
                    <p className="font-mono text-primary text-xl">Preparando Desafío...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col pt-20 pb-10">

            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
                {sessionWords.length > 0 ? (
                    <>
                        <QuizManager
                            words={sessionWords}
                            allWords={allWords.length > 0 ? allWords : sessionWords}
                            onComplete={handleQuizComplete}
                            onClose={handleQuizClose}
                        />
                        {finishing && (
                            <p role="status" aria-live="polite" className="font-mono text-sm text-muted-foreground">
                                Volviendo al inicio…
                            </p>
                        )}
                    </>
                ) : loadError ? (
                    <div className="text-center p-8 bg-card border-4 border-destructive pixel-border">
                        <p role="alert" className="text-xl font-bold mb-6">
                            No pudimos cargar el desafío. Revisa tu conexión e inténtalo de nuevo.
                        </p>
                        <Button onClick={fetchQuizWords} className="pixel-btn rounded-none">
                            <RotateCw className="mr-2" aria-hidden="true" /> REINTENTAR
                        </Button>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-card border-4 border-primary pixel-border">
                        <p className="text-xl font-bold mb-6">No hay palabras disponibles para practicar.</p>
                        <Button onClick={() => navigate('/dictionary')} className="pixel-btn rounded-none">
                            <Home className="mr-2" aria-hidden="true" /> IR AL DICCIONARIO
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
