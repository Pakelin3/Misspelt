import React, { useState, useEffect, useCallback, useContext } from 'react';
import useAxios from '@/utils/useAxios';
import AuthContext from '@/context/AuthContext';
import { toast } from 'sonner';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
    PixelEditIcon, PixelSaveIcon, PixelTargetIcon,
    PixelBookOpenIcon, PixelLightningIcon, SwordIcon,
    PixelStarIcon, TrophyIcon, PixelFireIcon
} from '@/components/PixelIcons';

// ─── Stat Gauge Component ─────────────────────────────────────
const StatGauge = ({ label, value, maxValue, suffix = '', isPercentage = false }) => {
    const percentage = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
    const displayValue = isPercentage ? `${value.toFixed(1)}%` : `${value}${suffix}`;
    const color = isPercentage
        ? (value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500')
        : 'bg-accent';
    const textColor = isPercentage
        ? (value >= 80 ? 'text-green-500' : value >= 50 ? 'text-yellow-500' : 'text-red-500')
        : 'text-accent';

    return (
        <div className="p-3 bg-muted/20 border-2 border-foreground/20 hover:border-foreground/40 transition-colors">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className={`text-sm font-mono font-bold ${textColor}`}>{displayValue}</span>
            </div>
            <div className="w-full h-2 bg-muted border border-foreground/20 relative">
                <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

// ─── Tab Button ───────────────────────────────────────────────
const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`
            px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all border-b-4
            ${active
                ? 'border-primary text-primary bg-primary/10 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }
        `}
    >
        {children}
    </button>
);

function ProfilePage() {
    const api = useAxios();
    const { user } = useContext(AuthContext);

    const [userStats, setUserStats] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [gameHistory, setGameHistory] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyCount, setHistoryCount] = useState(0);
    const [historyNext, setHistoryNext] = useState(null);
    const [historyPrev, setHistoryPrev] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('stats');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ full_name: '', current_avatar: '', current_title: '' });
    const [saving, setSaving] = useState(false);

    // ─── FETCH ────────────────────────────────────
    const userId = user?.user_id;

    const fetchAllData = useCallback(async () => {
        if (!userId) {
            setError('No hay usuario logueado.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [statsRes, profileRes] = await Promise.all([
                api.get('/user-stats/me/'),
                api.get('/profile/me/'),
            ]);
            setUserStats(statsRes.data);
            setProfileData(profileRes.data);
        } catch (err) {
            console.error("Error fetching profile data:", err);
            setError("No se pudieron cargar los datos del perfil.");
        } finally {
            setLoading(false);
        }
    }, [api, userId]);

    const fetchHistory = useCallback(async (page = 1) => {
        setHistoryLoading(true);
        try {
            const res = await api.get(`/game-history/?page=${page}`);
            const data = res.data;
            setGameHistory(data.results || []);
            setHistoryCount(data.count || 0);
            setHistoryNext(data.next);
            setHistoryPrev(data.previous);
            setHistoryPage(page);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory(1);
        }
    }, [activeTab, fetchHistory]);

    const startTutorial = useCallback(() => {
        const driverObj = driver({
            popoverClass: 'misspelt-driver-popover pixel-rendering',
            showProgress: true,
            animate: true,
            doneBtnText: '¡A Jugar!',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            steps: [
                {
                    element: '#tutorial-avatar',
                    popover: {
                        title: 'Este eres tú',
                        description: 'Aquí puedes ver tu avatar actual, tu nivel y título equipado. Puedes editar tu perfil pulsando el icono del lápiz.'
                    }
                },
                {
                    element: '#tutorial-xp',
                    popover: {
                        title: 'Experiencia (XP)',
                        description: 'Sube de nivel completando partidas y asimilando nuevas palabras. Cada nivel demostrará tu dominio.'
                    }
                },
                {
                    element: '#tutorial-quick-stats',
                    popover: {
                        title: 'Rendimiento Rápido',
                        description: 'Mantén tu racha diaria viva y colecciona insignias y avatares exclusivos para lucirlos.'
                    }
                },
                {
                    element: '#tutorial-tabs',
                    popover: {
                        title: 'Explora a fondo',
                        description: 'Navega entre tus estadísticas detalladas, el historial de tus últimas partidas y tu vitrina de insignias desbloqueadas.'
                    }
                }
            ],
            onDestroyStarted: () => {
                localStorage.setItem('misspelt_has_seen_dashboard_tour', 'true');
                driverObj.destroy();
            }
        });

        driverObj.drive();
    }, []);

    useEffect(() => {
        if (!loading && !error && userStats) {
            const hasSeenTour = localStorage.getItem('misspelt_has_seen_dashboard_tour');
            if (!hasSeenTour) {
                setTimeout(() => {
                    startTutorial();
                }, 500);
            }
        }
    }, [loading, error, userStats, startTutorial]);

    const handleStartEditing = () => {
        setEditForm({
            full_name: profileData?.full_name || '',
            current_avatar: profileData?.current_avatar || '',
            current_title: profileData?.current_title || '',
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const payload = {};
            if (editForm.full_name !== (profileData?.full_name || '')) payload.full_name = editForm.full_name;
            if (editForm.current_avatar !== (profileData?.current_avatar || '')) payload.current_avatar = editForm.current_avatar || null;
            if (editForm.current_title !== (profileData?.current_title || '')) payload.current_title = editForm.current_title || null;

            await api.patch('/profile/me/', payload);
            await fetchAllData();
            window.dispatchEvent(new Event('profileUpdated'));
            setIsEditing(false);
            toast.success('¡Perfil actualizado!');
        } catch (err) {
            console.error(err);
            toast.error('Error', { description: 'No se pudo guardar el perfil.' });
        } finally {
            setSaving(false);
        }
    };

    // ─── HELPERS ──────────────────────────────────
    const getAccuracy = (correct, total) => {
        if (!total || total === 0) return 0;
        return (correct / total) * 100;
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // ─── RENDER ───────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-16">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent animate-spin rounded-full" />
                    <p className="font-mono text-xs text-muted-foreground animate-pulse">CARGANDO PERFIL...</p>
                </div>
            </div>
        );
    }

    if (error || !userStats) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <div className="flex-1 flex items-center justify-center mt-16">
                    <p className="text-destructive font-mono">{error || 'Sin datos.'}</p>
                </div>
            </div>
        );
    }

    const generalAccuracy = getAccuracy(userStats.correct_answers_total, userStats.total_questions_answered);
    const slangAccuracy = getAccuracy(userStats.correct_slangs, userStats.slangs_seen);
    const pvAccuracy = getAccuracy(userStats.correct_phrasal_verbs, userStats.phrasal_verbs_seen);
    const currentAvatarObj = userStats.unlocked_avatars?.find(a => a.id === profileData?.current_avatar);
    const avatarSrc = currentAvatarObj?.image || `https://ui-avatars.com/api/?name=${userStats.user_username}&background=random`;

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12 mt-16">

                <div className="relative bg-card pixel-border p-6 md:p-8 mb-8">

                    {!isEditing ? (
                        <button
                            onClick={handleStartEditing}
                            className="absolute bottom-4 right-4 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border-2 border-transparent hover:border-primary"
                        >
                            <PixelEditIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="p-2 bg-primary text-primary-foreground border-2 border-foreground hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                <PixelSaveIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-2 text-muted-foreground hover:text-destructive text-base font-mono border-2 border-transparent hover:border-destructive transition-colors"
                            >
                                X
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div id="tutorial-avatar" className="relative shrink-0 flex flex-col items-center">
                            <div className="w-28 h-28 pixel-border bg-muted/30 p-1 overflow-hidden flex items-center justify-center">
                                <img
                                    src={isEditing ? (userStats.unlocked_avatars?.find(a => a.id === editForm.current_avatar)?.image || avatarSrc) : avatarSrc}
                                    alt="Avatar"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-accent text-accent-foreground font-mono text-[10px] font-bold pixel-border-accent z-10">
                                NVL {userStats.level}
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            {!isEditing ? (
                                <>
                                    <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-1">
                                        {profileData?.full_name || userStats.user_username}
                                    </h1>
                                    <p className="text-sm text-muted-foreground font-mono mb-1">@{userStats.user_username}</p>
                                    {profileData?.current_title && (
                                        <span className="inline-block px-3 py-1 text-[11px] font-mono font-bold bg-primary/20 text-primary border-2 border-primary/40 mt-1">
                                            {profileData.current_title}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-3 max-w-md">
                                    <div>
                                        <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Nombre Completo</label>
                                        <input
                                            value={editForm.full_name}
                                            onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                            className="w-full h-9 px-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus:border-primary text-sm font-mono"
                                            placeholder="Tu nombre..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Avatar</label>
                                        <div className="flex flex-wrap gap-2">
                                            {(userStats.unlocked_avatars || []).map(av => (
                                                <button
                                                    key={av.id}
                                                    onClick={() => setEditForm({ ...editForm, current_avatar: av.id })}
                                                    className={`w-14 h-14 p-1 border-2 transition-all ${editForm.current_avatar === av.id
                                                        ? 'border-primary bg-primary/20 scale-110'
                                                        : 'border-foreground/30 hover:border-foreground'
                                                        }`}
                                                >
                                                    <img src={av.image} alt={av.name} className="w-full h-full object-contain" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">Título</label>
                                        <select
                                            value={editForm.current_title}
                                            onChange={e => setEditForm({ ...editForm, current_title: e.target.value })}
                                            className="w-full h-9 px-3 bg-background border-2 border-foreground text-foreground rounded-none focus:outline-none focus:border-primary text-sm font-mono"
                                        >
                                            <option value="">Sin título</option>
                                            {(userStats.unlocked_titles || []).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            <div id="tutorial-xp" className="mt-4 max-w-sm mx-auto md:mx-0">
                                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                                    <span>XP: {userStats.experience}</span>
                                    <span>Siguiente: {userStats.xp_for_next_level}</span>
                                </div>
                                <div className="w-full h-3 bg-muted border-2 border-foreground relative">
                                    <div
                                        className="h-full bg-accent transition-all duration-700"
                                        style={{ width: `${userStats.xp_progress_in_current_level}%` }}
                                    />
                                    <div className="absolute top-0 left-0 w-full h-px bg-white/20" />
                                </div>
                                <p className="text-[10px] font-mono text-right text-muted-foreground mt-0.5">
                                    {userStats.xp_progress_in_current_level?.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div id="tutorial-quick-stats" className="hidden md:grid grid-cols-2 gap-2 shrink-0">
                            {[
                                { label: 'Racha', value: userStats.current_streak, icon: <PixelFireIcon className="w-6 h-6 text-yellow-500/80" /> },
                                { label: 'Récord', value: userStats.longest_streak, icon: <PixelStarIcon className="w-6 h-6 text-yellow-500" /> },
                                { label: 'Insignias', value: userStats.unlocked_badges?.length || 0, icon: <TrophyIcon className="w-6 h-6 text-yellow-400" /> },
                                { label: 'Avatares', value: userStats.unlocked_avatars?.length || 0, icon: <SwordIcon className="w-6 h-6" /> },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-2 px-3 py-2 bg-muted/20 border border-foreground/20">
                                    <div className="shrink-0 flex justify-center w-8">{s.icon}</div>
                                    <div>
                                        <p className="text-base font-mono font-bold text-foreground leading-none">{s.value}</p>
                                        <p className="text-[9px] font-mono text-muted-foreground uppercase">{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════ TABS ═══════════ */}
                <div id="tutorial-tabs" className="flex border-b-2 border-foreground/20 mb-6 overflow-x-auto">
                    <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
                        Estadísticas
                    </TabButton>
                    <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                        Historial
                    </TabButton>
                    <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')}>
                        Insignias
                    </TabButton>
                </div>

                {/* ═══════════ TAB CONTENT ═══════════ */}

                {/* ─── STATS TAB ─── */}
                {activeTab === 'stats' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-card pixel-border p-5">
                            <h3 className="font-mono text-sm uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                                <PixelTargetIcon className="w-5 h-5 text-red-500" /> Precisión
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <StatGauge label="General" value={generalAccuracy} maxValue={100} isPercentage />
                                <StatGauge label="Slangs" value={slangAccuracy} maxValue={100} isPercentage />
                                <StatGauge label="Phrasal Verbs" value={pvAccuracy} maxValue={100} isPercentage />
                            </div>
                        </div>
                        <div className="bg-card pixel-border p-5">
                            <h3 className="font-mono text-sm uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                                <PixelBookOpenIcon className="w-5 h-5 text-blue-500" /> Conocimiento
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatGauge label="Slangs Dominados" value={userStats.slangs_learned || 0} maxValue={100} />
                                <StatGauge label="Idioms Dominados" value={userStats.idioms_learned || 0} maxValue={50} />
                                <StatGauge label="PV Dominados" value={userStats.phrasal_verbs_learned || 0} maxValue={50} />
                                <StatGauge label="Vocabulario" value={userStats.vocabulary_learned || 0} maxValue={200} />
                            </div>
                        </div>
                        <div className="bg-card pixel-border p-5">
                            <h3 className="font-mono text-sm uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                                <PixelLightningIcon className="w-5 h-5 text-yellow-500" /> Actividad
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <StatGauge label="Palabras Vistas" value={userStats.words_seen_total || 0} maxValue={500} />
                                <StatGauge label="Preguntas" value={userStats.total_questions_answered || 0} maxValue={1000} />
                                <StatGauge label="Respuestas Correctas" value={userStats.correct_answers_total || 0} maxValue={userStats.total_questions_answered || 1} />
                            </div>
                        </div>
                        <div className="bg-card pixel-border p-5">
                            <h3 className="font-mono text-sm uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                                <SwordIcon className="w-5 h-5 text-foreground" /> Combate (Acumulado)
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <StatGauge label="Letras Eliminadas" value={userStats.total_letters_killed || 0} maxValue={5000} />
                                <StatGauge label="Jefes Derrotados" value={userStats.total_bosses_killed || 0} maxValue={50} />
                                <StatGauge label="Tiempo Jugado" value={userStats.total_time_played_seconds || 0} maxValue={36000} suffix={` (${formatTime(userStats.total_time_played_seconds)})`} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── HISTORY TAB ─── */}
                {activeTab === 'history' && (
                    <div className="animate-in fade-in duration-300">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-10 h-10 border-4 border-accent border-t-transparent animate-spin rounded-full" />
                                <p className="font-mono text-xs text-muted-foreground animate-pulse">CARGANDO HISTORIAL...</p>
                            </div>
                        ) : gameHistory.length === 0 ? (
                            <div className="text-center p-12 bg-card pixel-border text-muted-foreground">
                                <PixelBookOpenIcon className="w-10 h-10 mb-3 mx-auto text-muted-foreground/50" />
                                <p className="font-mono text-sm">Aún no has jugado ninguna partida.</p>
                                <p className="text-xs mt-1">¡Ve a jugar y tu historial aparecerá aquí!</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {gameHistory.map(game => {
                                        const accuracy = getAccuracy(game.correct_in_game, game.total_questions_in_game);
                                        const accColor = accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500';
                                        const isSurvivor = game.game_mode === 'SURVIVOR';

                                        return (
                                            <div key={game.id} className="bg-card pixel-border p-4 flex flex-col gap-4 hover:bg-muted/20 transition-colors">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                    <div className={`
                                                        w-12 h-12 flex items-center justify-center border-2 shrink-0
                                                        ${isSurvivor ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-blue-500/50 bg-blue-500/10 text-blue-500'}
                                                    `}>
                                                        {isSurvivor ? <SwordIcon className="w-6 h-6" /> : <PixelBookOpenIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${isSurvivor ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'}`}>
                                                                {isSurvivor ? 'SURVIVOR' : 'QUIZ'}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">{formatDate(game.played_at)}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                                                            {game.total_questions_in_game > 0 && (
                                                                <span>Preguntas: <span className="text-foreground font-bold">{game.correct_in_game}/{game.total_questions_in_game}</span></span>
                                                            )}
                                                            {game.time_spent_seconds > 0 && (
                                                                <span>Tiempo: <span className="text-foreground font-bold">{formatTime(game.time_spent_seconds)}</span></span>
                                                            )}
                                                            {isSurvivor && game.letters_killed > 0 && (
                                                                <span>Letras: <span className="text-foreground font-bold">{game.letters_killed}</span></span>
                                                            )}
                                                            {isSurvivor && game.bosses_killed > 0 && (
                                                                <span>Jefes: <span className="text-foreground font-bold">{game.bosses_killed}</span></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        {game.total_questions_in_game > 0 && (
                                                            <div className="text-right">
                                                                <p className={`font-mono text-lg font-bold ${accColor}`}>{accuracy.toFixed(0)}%</p>
                                                                <p className="text-[9px] font-mono text-muted-foreground uppercase">Precisión</p>
                                                            </div>
                                                        )}
                                                        <div className="text-right">
                                                            <p className="font-mono text-lg font-bold text-accent">+{game.score}</p>
                                                            <p className="text-[9px] font-mono text-muted-foreground uppercase">XP</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {game.ai_evaluation && (() => {
                                                    const aiEval = game.ai_evaluation.evaluacion || game.ai_evaluation;
                                                    const quality = aiEval.calidad || 0;
                                                    const qualityColor = quality >= 80 ? 'text-green-500' : quality >= 50 ? 'text-yellow-500' : 'text-red-500';

                                                    return (
                                                        <div className="mt-2 pt-3 border-t-2 border-dashed border-foreground/20">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-sm">🔮</span>
                                                                <span className="text-[11px] font-mono font-bold uppercase text-primary tracking-wider">Evaluación del Oráculo</span>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div className="md:col-span-2">
                                                                    <p className="text-sm leading-relaxed border-l-2 border-primary pl-3 italic text-foreground/90">
                                                                        "{aiEval.feedback_general}"
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-4">
                                                                    <div>
                                                                        <p className="text-[10px] uppercase font-mono text-muted-foreground mb-1">Calidad</p>
                                                                        <div className={`text-base font-bold ${qualityColor}`}>{quality}/100</div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] uppercase font-mono text-muted-foreground mb-1">Feedback</p>
                                                                        <div className="text-sm font-bold text-foreground">{aiEval.consistencia}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>
                                {historyCount > 5 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-foreground/20">
                                        <button
                                            onClick={() => fetchHistory(historyPage - 1)}
                                            disabled={!historyPrev}
                                            className="px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-foreground bg-card hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed pixel-border"
                                        >
                                            ◀ Anterior
                                        </button>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            Página {historyPage} de {Math.ceil(historyCount / 5)}
                                        </span>
                                        <button
                                            onClick={() => fetchHistory(historyPage + 1)}
                                            disabled={!historyNext}
                                            className="px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-foreground bg-card hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed pixel-border"
                                        >
                                            Siguiente ▶
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ─── BADGES TAB ─── */}
                {activeTab === 'badges' && (
                    <div className="animate-in fade-in duration-300">
                        {(!userStats.unlocked_badges || userStats.unlocked_badges.length === 0) ? (
                            <div className="text-center p-12 bg-card pixel-border text-muted-foreground">
                                <TrophyIcon className="w-10 h-10 mb-3 mx-auto text-muted-foreground/50" />
                                <p className="font-mono text-sm">Aún no has desbloqueado insignias.</p>
                                <p className="text-xs mt-1">¡Sigue jugando para ganar tus primeras insignias!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                                {userStats.unlocked_badges.map(badge => (
                                    <div key={badge.id} className="bg-card pixel-border p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                                        <div className="w-16 h-16 mb-3 flex items-center justify-center">
                                            {badge.image ? (
                                                <img src={badge.image} alt={badge.title} className="w-full h-full object-contain" />
                                            ) : (
                                                <TrophyIcon className="w-10 h-10 text-yellow-500/80" />
                                            )}
                                        </div>
                                        <h4 className="font-mono text-[11px] font-bold text-foreground leading-tight mb-1">{badge.title}</h4>
                                        {/* <p className="text-[9px] text-muted-foreground leading-tight">{badge.reward_description}</p> */}
                                        <div className={`
                                            mt-2 px-2 py-0.5 text-[8px] font-mono font-bold uppercase border
                                            ${badge.category === 'LEGENDARY' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
                                                badge.category === 'EPIC' ? 'border-purple-500 text-purple-500 bg-purple-500/10' :
                                                    badge.category === 'RARE' ? 'border-blue-500 text-blue-500 bg-blue-500/10' :
                                                        'border-stone-700 text-stone-700 bg-stone-700/10'}
                                        `}>
                                            {badge.category}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
            <button
                onClick={startTutorial}
                className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-accent-foreground pixel-border flex items-center justify-center text-2xl hover:scale-110 transition-transform z-50 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                title="Ver Tutorial de Nuevo"
            >
                <span className="font-mono text-3xl pb-1">?</span>
            </button>
        </div>
    );
}

export default ProfilePage;