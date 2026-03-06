import React, { useState, useEffect, useCallback, useContext } from 'react';
import useAxios from '@/utils/useAxios';
import AuthContext from '@/context/AuthContext';
import Navbar from "@/components/Navbar";
import BadgeCard from "@/components/ui/BadgeCard";
import { TrophyIcon } from '@/components/PixelIcons';

// Configuración de categorías con colores temáticos RPG
const CATEGORY_CONFIG = [
    {
        key: 'LEGENDARY',
        label: 'LEGENDARIAS',
        emoji: '👑',
        borderColor: 'border-yellow-500',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-500',
        accentBg: 'bg-yellow-500',
        glowClass: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
    },
    {
        key: 'EPIC',
        label: 'ÉPICAS',
        emoji: '💜',
        borderColor: 'border-purple-500',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
        accentBg: 'bg-purple-500',
        glowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    },
    {
        key: 'RARE',
        label: 'RARAS',
        emoji: '💎',
        borderColor: 'border-blue-500',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
        accentBg: 'bg-blue-500',
        glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    },
    {
        key: 'BASIC',
        label: 'BÁSICAS',
        emoji: '⭐',
        borderColor: 'border-stone-400',
        bgColor: 'bg-stone-400/10',
        textColor: 'text-stone-400',
        accentBg: 'bg-stone-400',
        glowClass: '',
    },
];

// Chevron icon para el acordeón
const ChevronIcon = ({ open }) => (
    <svg
        className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

function BadgesPage() {
    const api = useAxios();
    const { user } = useContext(AuthContext);

    // Estados
    const [allBadges, setAllBadges] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [openSections, setOpenSections] = useState({
        LEGENDARY: true, EPIC: true, RARE: true, BASIC: true
    });

    // --- FETCH DE DATOS ---
    const fetchBadgeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setInfoMessage(null);
        try {
            const allBadgesResponse = await api.get('/badges/');
            const fetchedAllBadges = Array.isArray(allBadgesResponse.data) ? allBadgesResponse.data : (allBadgesResponse.data.results || []);
            setAllBadges(fetchedAllBadges);

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

    // --- TOGGLE SECCIÓN ---
    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- LÓGICA DE CÁLCULO DE ESTADO ---
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
                'slangs_learned': 'Slangs dominados',
                'idioms_learned': 'Idioms dominados',
                'phrasal_verbs_learned': 'PV dominados',
                'vocabulary_learned': 'Vocabulario dominado',
                'total_letters_killed': 'Letras eliminadas',
                'total_bosses_killed': 'Jefes derrotados',
                'total_time_played_seconds': 'Tiempo jugado (s)',
                'level_reached': 'Nivel alcanzado',
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
                'slangs_learned': 'slangs_learned',
                'idioms_learned': 'idioms_learned',
                'phrasal_verbs_learned': 'phrasal_verbs_learned',
                'vocabulary_learned': 'vocabulary_learned',
                'total_letters_killed': 'total_letters_killed',
                'total_bosses_killed': 'total_bosses_killed',
                'total_time_played_seconds': 'total_time_played_seconds',
                'level_reached': 'level',
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

    // --- AGRUPAR BADGES POR CATEGORÍA ---
    const groupedBadges = CATEGORY_CONFIG.map(cat => {
        const badges = allBadges.filter(b => (b.category || 'BASIC') === cat.key);
        const unlockedCount = badges.filter(b => getBadgeStatus(b).unlocked).length;
        return { ...cat, badges, unlockedCount, totalCount: badges.length };
    }).filter(group => group.badges.length > 0);

    // Resumen global
    const totalBadges = allBadges.length;
    const totalUnlocked = allBadges.filter(b => getBadgeStatus(b).unlocked).length;

    // --- RENDERIZADO ---
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Navbar />

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12 mt-16">

                {/* HEADER */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center p-4 bg-accent/20 rounded-full pixel-border-accent mb-4">
                        <TrophyIcon className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-mono text-foreground mb-3">SALA DE TROFEOS</h1>
                    <p className="text-xl text-muted-foreground font-sans max-w-2xl mx-auto mb-4">
                        Aquí se exhiben los hitos de tu aventura. ¡Completa desafíos para llenar las vitrinas!
                    </p>

                    {/* Resumen global */}
                    {!loading && totalBadges > 0 && (
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-card pixel-border font-mono text-sm">
                            <span className="text-muted-foreground">Colección:</span>
                            <span className="text-accent font-bold">{totalUnlocked}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-foreground">{totalBadges}</span>
                            <div className="w-24 h-3 bg-muted border-2 border-foreground relative ml-2">
                                <div
                                    className="h-full bg-accent transition-all duration-700"
                                    style={{ width: `${totalBadges > 0 ? (totalUnlocked / totalBadges) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    )}
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

                {/* LOADING */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-16 h-16 border-4 border-accent border-t-transparent animate-spin rounded-full"></div>
                        <p className="font-mono text-xs text-muted-foreground animate-pulse">PULIENDO TROFEOS...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groupedBadges.map(group => (
                            <div key={group.key} className={`${group.glowClass} transition-shadow duration-300`}>
                                {/* Section Header */}
                                <button
                                    onClick={() => toggleSection(group.key)}
                                    className={`
                                        w-full flex items-center justify-between px-5 py-3
                                        border-4 ${group.borderColor} ${group.bgColor}
                                        hover:brightness-110 transition-all duration-200 cursor-pointer
                                        select-none
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{group.emoji}</span>
                                        <h2 className={`font-mono text-lg md:text-xl font-bold tracking-wider ${group.textColor}`}>
                                            {group.label}
                                        </h2>
                                        <div className={`
                                            px-2 py-0.5 text-[11px] font-mono font-bold
                                            ${group.accentBg} text-white border-2 border-foreground/20
                                        `}>
                                            {group.unlockedCount}/{group.totalCount}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Mini progress bar */}
                                        <div className="hidden sm:block w-32 h-2 bg-muted/50 border border-foreground/20 relative">
                                            <div
                                                className={`h-full ${group.accentBg} transition-all duration-700`}
                                                style={{ width: `${group.totalCount > 0 ? (group.unlockedCount / group.totalCount) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <ChevronIcon open={openSections[group.key]} />
                                    </div>
                                </button>

                                {/* Section Body (Collapsible) */}
                                <div className={`
                                    overflow-hidden transition-all duration-400 ease-in-out
                                    ${openSections[group.key] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                                `}>
                                    <div className={`
                                        p-4 md:p-6 border-x-4 border-b-4 ${group.borderColor}
                                        bg-card/50
                                    `}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {group.badges.map(badge => (
                                                <BadgeCard
                                                    key={badge.id}
                                                    badge={badge}
                                                    status={getBadgeStatus(badge)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BadgesPage;