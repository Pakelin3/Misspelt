import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import useAxios from '@/utils/useAxios';
import { useTheme } from '@/context/ThemeContext';
import AuthContext from '@/context/AuthContext';
import { ScaleLoader } from 'react-spinners';
import { Plus, Minus } from 'lucide-react'; 

function ProfilePage() {
    const api = useAxios();
    const { theme } = useTheme();
    const { user } = useContext(AuthContext); 

    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState(''); 

    const statLabels = useMemo(() => ({
        experience: 'Experiencia Total',
        words_seen_total: 'Palabras Vistas',
        slangs_seen: 'Slangs Vistos',
        phrasal_verbs_seen: 'Phrasal Verbs Vistos',
        correct_answers_total: 'Respuestas Correctas',
        total_questions_answered: 'Preguntas Respondidas',
        correct_slangs: 'Slangs Acertados',
        total_slangs_questions: 'Preguntas Slangs',
        correct_phrasal_verbs: 'Phrasal Verbs Acertados',
        total_phrasal_verbs_questions: 'Preguntas Phrasal Verbs',
        current_streak: 'Racha Actual',
        longest_streak: 'Racha Más Larga',
    }), []);

    const fetchUserStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (user && user.user_id) {
                const response = await api.get('/user-stats/me/');
                setUserStats(response.data);
            } else {
                setError('No hay usuario logueado.');
            }
        } catch (err) {
            console.error("Error fetching user stats:", err);
            setError("No se pudieron cargar las estadísticas del usuario.");
        } finally {
            setLoading(false);
        }
    }, [api, user]);

    useEffect(() => {
        fetchUserStats();
    }, [fetchUserStats]);

    const handleUpdateStat = useCallback(async (statName, delta) => {
        if (!userStats) return;

        const oldValue = userStats[statName] || 0; 
        const newValue = Math.max(0, oldValue + delta); 

        setFeedbackMessage(''); 

        try {
            const payload = { [statName]: newValue };
            const response = await api.patch('/user-stats/me/', payload);
            setUserStats(response.data); 

            let message = `${statLabels[statName]} actualizado a ${newValue}.`;
            if (response.data.newly_unlocked_badges && response.data.newly_unlocked_badges.length > 0) {
                message += ` ¡Has desbloqueado nuevas insignias: ${response.data.newly_unlocked_badges.join(', ')}!`;
            }
            setFeedbackMessage(message);

            setTimeout(() => setFeedbackMessage(''), 3000);

        } catch (err) {
            console.error(`Error al actualizar ${statName}:`, err.response?.data || err.message);
            setFeedbackMessage(`Error al actualizar ${statLabels[statName]}.`);
        }
    }, [api, userStats, statLabels]);

    if (loading) {
        return (
            <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center 
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <ScaleLoader color={theme === 'light' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)'} loading={true} size={50} aria-label="Cargando perfil" />
                <p className={`ml-4 ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>Cargando perfil...</p>
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

    if (!userStats) {
        return (
            <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center p-4 
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <p className={`text-lg ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                    No se encontraron estadísticas para tu perfil.
                </p>
            </div>
        );
    }

    return (
        <div className={`min-h-[calc(100vh-64px)] p-6 ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
            <h1 className={`text-3xl font-bold mb-8 text-center ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                Perfil de Usuario
            </h1>

            <div className={`max-w-2xl mx-auto p-6 rounded-lg shadow-md
                ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
                <h2 className={`text-2xl font-semibold mb-4 ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                    Estadísticas de {userStats.user_username}
                </h2>

                {feedbackMessage && (
                    <div className="mb-4 p-3 bg-green-200 text-green-800 rounded">
                        {feedbackMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nivel y XP */}
                    <div className={`p-4 rounded-md ${theme === 'light' ? 'bg-gray-100' : 'bg-[var(--color-dark-bg-tertiary)]'}`}>
                        <p className={`font-semibold ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                            Nivel: <span className="font-bold text-[var(--color-accent-blue)]">{userStats.level}</span>
                        </p>
                        <p className={`text-sm ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                            XP Total: {userStats.experience}
                        </p>
                        <p className={`text-sm ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                            Próximo Nivel: {userStats.xp_for_next_level} XP
                        </p>
                        <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                            <div className="bg-[var(--color-accent-green)] h-2 rounded-full" style={{ width: `${userStats.xp_progress_in_current_level}%` }}></div>
                        </div>
                        <p className={`text-xs text-right mt-1 ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                            {userStats.xp_progress_in_current_level}%
                        </p>
                    </div>

                    {/* Lista de Estadísticas Modificables */}
                    <div className="md:col-span-2">
                        <h3 className={`text-lg font-semibold mt-4 mb-2 ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}>
                            Estadísticas para Probar Insignias:
                        </h3>
                        <ul className="space-y-2">
                            {Object.entries(statLabels).map(([key, label]) => (
                                <li key={key} className={`flex items-center justify-between p-3 rounded-md
                                    ${theme === 'light' ? 'bg-gray-100' : 'bg-[var(--color-dark-bg-tertiary)]'}`}>
                                    <span className={theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}>
                                        {label}: <span className="font-semibold">{userStats[key] || 0}</span>
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleUpdateStat(key, -1)}
                                            className={`p-1 rounded-full ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-neutral-600 hover:bg-neutral-700'} ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}
                                            aria-label={`Disminuir ${label}`}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStat(key, 1)}
                                            className={`p-1 rounded-full ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-neutral-600 hover:bg-neutral-700'} ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}
                                            aria-label={`Aumentar ${label}`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStat(key, 5)} // Aumentar en 5 para pruebas rápidas
                                            className={`p-1 rounded-full ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-neutral-600 hover:bg-neutral-700'} ${theme === 'light' ? 'text-[var(--color-text-main)]' : 'text-[var(--color-dark-text)]'}`}
                                            aria-label={`Aumentar ${label} en 5`}
                                        >
                                            +5
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;