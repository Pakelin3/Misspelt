import React, { useState, useEffect, useCallback, useContext } from 'react';
import useAxios from '@/utils/useAxios'; 
import { useTheme } from '@/context/ThemeContext'; 
import AuthContext from '@/context/AuthContext'; 
import { ScaleLoader } from 'react-spinners'; 

function BadgesPage() {
    const api = useAxios(); 
    const { theme } = useTheme(); 
    const { user } = useContext(AuthContext); 
    const [allBadges, setAllBadges] = useState([]); 
    const [userStats, setUserStats] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const [infoMessage, setInfoMessage] = useState(null);

    const fetchBadgeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setInfoMessage(null);
        try {
            // 1. Obtener todos los badges del sistema
            const allBadgesResponse = await api.get('/badges/'); 
            const fetchedAllBadges = allBadgesResponse.data.results || [];
            setAllBadges(fetchedAllBadges);
            // 2. Obtener las estadísticas del usuario actual
            let currentUserStats = null;
            if (user && user.user_id) {
                try {
                    const userStatsResponse = await api.get(`/user-stats/me/`); 
                    currentUserStats = userStatsResponse.data;
                    setUserStats(currentUserStats);
                } catch (userStatsErr) {
                    console.warn("No se pudieron cargar las estadísticas del usuario. Podría no tener entradas en UserStats.", userStatsErr);
                    setInfoMessage("No se encontraron estadísticas para tu usuario. Juega un poco para empezar a ganar insignias.");
                    setUserStats(null); 
                }
            } else {
                setInfoMessage("Debes iniciar sesión para ver tus insignias.");
            }

            if (fetchedAllBadges.length === 0) {
                setInfoMessage("No hay insignias configuradas en el sistema todavía.");
            } else if (fetchedAllBadges.length > 0 && !user && !currentUserStats) {
                setInfoMessage("Inicia sesión para ver tu progreso de insignias.");
            }


        } catch (err) {
            console.error("Error al cargar los datos de insignias:", err);
            setError("Error al cargar las insignias o tus estadísticas. Inténtalo de nuevo más tarde.");
        } finally {
            setLoading(false);
        }
    }, [api, user]); 

    useEffect(() => {
        fetchBadgeData();
    }, [fetchBadgeData]);

    const getBadgeStatus = (badge) => {
        if (!userStats || !userStats.unlocked_badges || !Array.isArray(userStats.unlocked_badges)) {
            return { unlocked: false, progress: 0, showProgress: false, conditionText: badge.condition_description };
        }
        const isUnlocked = userStats.unlocked_badges.some(ub => ub.id === badge.id); 

        let progress = 0;
        let showProgress = false;
        let conditionText = badge.condition_description; 

        if (isUnlocked) {
            progress = 100;
            showProgress = true; 
            conditionText = badge.reward_description; 
        } else if (badge.unlock_condition_data && Array.isArray(badge.unlock_condition_data) && badge.unlock_condition_data.length > 0 && userStats) {
            const conditionTypeToSpanish = {
                'correct_slangs': 'Slangs acertados',
                'total_exp_achieved': 'Experiencia total', 
                'answered_total_questions': 'Preguntas respondidas',
                'words_seen_total': 'Palabras vistas',  
                'phrasal_verbs_seen': 'Phrasal verbs vistos',
                'correct_answers_total': 'Respuestas correctas',
                'total_slangs_questions': 'Preguntas de slangs',
                'correct_phrasal_verbs': 'Phrasal verbs correctos',
                'total_phrasal_verbs_questions': 'Preguntas de phrasal verbs',
                'current_streak': 'Racha actual',
                'longest_streak': 'Racha más larga',
            };

            const conditionTypeToUserStatsField = {
                'correct_slangs': 'correct_slangs',
                'total_exp_achieved': 'experience', 
                'answered_total_questions': 'total_questions_answered',
                'words_seen_total': 'words_seen_total',
                'phrasal_verbs_seen': 'phrasal_verbs_seen',
                'correct_answers_total': 'correct_answers_total',
                'total_slangs_questions': 'total_slangs_questions',
                'correct_phrasal_verbs': 'correct_phrasal_verbs',
                'total_phrasal_verbs_questions': 'total_phrasal_verbs_questions',
                'current_streak': 'current_streak',
                'longest_streak': 'longest_streak',
            };

            const firstCondition = badge.unlock_condition_data[0]; 
            const conditionType = firstCondition.type; 
            const requiredValue = firstCondition.value;
            const userStatsFieldName = conditionTypeToUserStatsField[conditionType];
            const userCurrentValue = userStatsFieldName ? userStats[userStatsFieldName] : undefined; 
            
            if (typeof userCurrentValue === 'number' && typeof requiredValue === 'number' && requiredValue > 0) {
                progress = Math.min(100, (userCurrentValue / requiredValue) * 100);
                showProgress = true; 
                conditionText = `${conditionTypeToSpanish[conditionType] || conditionType}: ${userCurrentValue}/${requiredValue}`;
            } else {
                progress = 0;
                showProgress = false;
                conditionText = badge.condition_description; 
            }
        }
        return { unlocked: isUnlocked, progress: Math.floor(progress), showProgress: showProgress, conditionText: conditionText };
    };

    // --- RENDERIZADO DEL COMPONENTE ---

    if (loading) {
        return (
            <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center 
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <ScaleLoader color={theme === 'light' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)'} loading={true} size={50} aria-label="Cargando insignias" />
                <p className={`ml-4 ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>Cargando insignias...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center 
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <p className="text-red-500 text-center">{error}</p>
            </div>
        );
    }

    if (infoMessage) {
        return (
            <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center p-4 
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <div className={`p-6 rounded-lg text-center
                    ${theme === 'light' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-main)]' : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)]'}`}>
                    <p className="text-lg">{infoMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-[calc(100vh-64px)] p-6 ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
            <h1 className={`text-3xl font-bold mb-8 text-center ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                Logros
            </h1>
            <p className={`text-md mb-8 text-center ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                Desbloquea logros completando tareas en la plataforma.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                {allBadges.map(badge => {
                    const { unlocked, progress, showProgress, conditionText } = getBadgeStatus(badge);
                    
                    return (
                        <div
                            key={badge.id}
                            className={`badge-card relative overflow-hidden rounded-lg shadow-md p-6 flex flex-col items-center justify-between transition-transform duration-200 hover:scale-105
                                ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}
                                ${unlocked ? 'border-2 border-[var(--color-accent-green)]' : 'border-2 border-transparent'}
                            `}
                        >
                            {/* Icono/Imagen del Badge */}
                            <div className="relative w-24 h-24 mb-4">
                                <img
                                    src={badge.image}
                                    alt={badge.title}
                                    className={`w-full h-full object-contain transition-all duration-300 ${unlocked ? '' : 'grayscale opacity-70'}`}/>
                                {unlocked && (
                                    <div className="absolute bottom-0 right-0 p-1 bg-[var(--color-accent-green)] rounded-full text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                                    </div>
                                )}
                            </div>

                            {/* Título del Badge */}
                            <h3 className={`text-lg font-semibold mb-2 text-center ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                                {badge.title}
                            </h3>

                            {/* Requerimiento / Descripción de la Condición */}
                            <p className={`text-sm text-center mb-3 ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                                {conditionText} {/* Usa el conditionText calculado */}
                            </p>

                            {/* Barra de Progreso */}
                            {showProgress && ( // Mostrar progreso solo si `showProgress` es true
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-auto">
                                    <div
                                        className="bg-[var(--color-bg-secondary)] h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    <p className={`text-xs text-right mt-1 ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                                        {progress}%
                                    </p>
                                </div>
                            )}
                            {/* Mensaje si no hay progreso visible */}
                            {!showProgress && !unlocked && ( // Si no se muestra la barra y no está desbloqueado
                                <p className={`text-xs text-center mt-auto ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                                    (Condición no programática o no aplicable)
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default BadgesPage;