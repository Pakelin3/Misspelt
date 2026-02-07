import React, { useState, useEffect, useCallback, useContext } from 'react';
import useAxios from '@/utils/useAxios';
import AuthContext from '@/context/AuthContext';
import Navbar from "@/components/Navbar";
import BadgeCard from "@/components/badges/BadgeCard";
import { TrophyIcon } from '@/components/PixelIcons';

function BadgesPage() {
    const api = useAxios();
    const { user } = useContext(AuthContext);

    // Estados
    const [allBadges, setAllBadges] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);

    // --- FETCH DE DATOS ---
    const fetchBadgeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setInfoMessage(null);
        try {
            // 1. Obtener insignias
            const allBadgesResponse = await api.get('/badges/');
            const fetchedAllBadges = allBadgesResponse.data.results || [];
            setAllBadges(fetchedAllBadges);

            // 2. Obtener estadísticas (solo si hay usuario)
            let currentUserStats = null;
            if (user && user.user_id) {
                try {
                    const userStatsResponse = await api.get(`/user-stats/me/`);
                    currentUserStats = userStatsResponse.data;
                    setUserStats(currentUserStats);
                } catch (userStatsErr) {
                    console.warn("Stats no encontrados:", userStatsErr);
                    setInfoMessage("Empieza a jugar para ver tus estadísticas.");
                    setUserStats(null);
                }
            } else {
                setInfoMessage("Inicia sesión para registrar tus logros.");
            }

            // Mensajes de estado vacíos
            if (fetchedAllBadges.length === 0) {
                setInfoMessage("No hay insignias disponibles en este momento.");
            }

        } catch (err) {
            console.error("Error fetching badges:", err);
            setError("No se pudo conectar con el gremio de aventureros.");
        } finally {
            setLoading(false);
        }
    }, [api, user]);

    useEffect(() => {
        fetchBadgeData();
    }, [fetchBadgeData]);

    // --- LÓGICA DE CÁLCULO DE ESTADO (Mantenida de tu código) ---
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
            conditionText = badge.reward_description || "¡Logro completado!";
        } else if (badge.unlock_condition_data && Array.isArray(badge.unlock_condition_data) && badge.unlock_condition_data.length > 0 && userStats) {
            const conditionTypeToSpanish = {
                'correct_slangs': 'Slangs acertados',
                'total_exp_achieved': 'XP Total',
                'answered_total_questions': 'Preguntas totales',
                'words_seen_total': 'Palabras descubiertas',
                'phrasal_verbs_seen': 'Phrasal verbs vistos',
                'correct_answers_total': 'Aciertos totales',
                'total_slangs_questions': 'Preguntas de Slang',
                'correct_phrasal_verbs': 'Phrasal Verbs correctos',
                'total_phrasal_verbs_questions': 'Preguntas PV',
                'current_streak': 'Racha actual',
                'longest_streak': 'Mejor racha',
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
            }
        }
        return { unlocked: isUnlocked, progress: Math.floor(progress), showProgress: showProgress, conditionText: conditionText };
    };

    // --- RENDERIZADO ---
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navbar />

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12 mt-16">
                
                {/* HEADER */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-accent/20 rounded-full pixel-border-accent mb-4">
                        <TrophyIcon className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-mono text-foreground mb-4">SALA DE TROFEOS</h1>
                    <p className="text-xl text-muted-foreground font-sans max-w-2xl mx-auto">
                        Aquí se exhiben los hitos de tu aventura. ¡Completa desafíos para llenar las vitrinas!
                    </p>
                </div>

                {/* MENSAJES DE ESTADO */}
                {infoMessage && !loading && (
                    <div className="mb-8 p-4 bg-primary/10 border-l-4 border-primary text-primary font-sans text-xl">
                        {infoMessage}
                    </div>
                )}

                {error && (
                    <div className="mb-8 p-4 bg-destructive/10 border-l-4 border-destructive text-destructive font-mono text-xs">
                        {error}
                    </div>
                )}

                {/* GRID DE INSIGNIAS */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-16 h-16 border-4 border-accent border-t-transparent animate-spin rounded-full"></div>
                        <p className="font-mono text-xs text-muted-foreground animate-pulse">PULIENDO TROFEOS...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {allBadges.map(badge => (
                            <BadgeCard 
                                key={badge.id} 
                                badge={badge} 
                                status={getBadgeStatus(badge)} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BadgesPage;