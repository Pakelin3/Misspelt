import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAxios from '@/utils/useAxios';
import QuizManager from '@/components/quiz/QuizManager';
import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';

const QuizPage = () => {
    const [{ sessionWords, loading }, setState] = useState({ sessionWords: [], loading: true });
    const api = useAxios();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizWords = async () => {
            try {
                const response = await api.get('/game/quiz-words/?discovered=true');
                const data = Array.isArray(response.data) ? response.data : response.data.results || [];
                setState({ sessionWords: data, loading: false });
            } catch (error) {
                console.error("Error loading quiz words:", error);
                setState(prev => ({ ...prev, loading: false }));
            }
        };

        fetchQuizWords();
    }, [api]);

    const handleQuizComplete = () => {
        setTimeout(() => {
            navigate('/');
        }, 3500);
    };

    const handleQuizClose = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4"></div>
                <p className="font-pixel text-primary text-xl">Preparando Desafío...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col pt-20 pb-10">

            <div className="flex-1 flex items-center justify-center px-4">
                {sessionWords.length > 0 ? (
                    <QuizManager
                        words={sessionWords}
                        allWords={sessionWords}
                        onComplete={handleQuizComplete}
                        onClose={handleQuizClose}
                    />
                ) : (
                    <div className="text-center p-8 bg-card border-4 border-primary pixel-border">
                        <p className="text-xl font-bold mb-6">No hay palabras disponibles para practicar.</p>
                        <Button onClick={() => navigate('/dictionary')} className="pixel-btn rounded-none">
                            <Home className="mr-2" /> IR AL DICCIONARIO
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
