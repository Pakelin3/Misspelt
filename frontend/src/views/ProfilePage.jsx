import React, { useState, useEffect, useCallback, useContext } from 'react';
import useAxios from '@/utils/useAxios';
import AuthContext from '@/context/AuthContext';
import { toast } from 'sonner';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import TabButton from '@/components/profile/TabButton';
import ProfileHeader from '@/components/profile/ProfileHeader';
import JoinFarmWidget from '@/components/profile/JoinFarmWidget';
import StatsTab from '@/components/profile/StatsTab';
import HistoryTab from '@/components/profile/HistoryTab';
import BadgesTab from '@/components/profile/BadgesTab';
import FarmsTab from '@/components/profile/FarmsTab';
import ThemeSelector from '@/components/profile/ThemeSelector';
import usePageTitle from '@/hooks/usePageTitle';

function ProfilePage() {
    usePageTitle('Mi perfil');
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

    // Granjas
    const [inviteCode, setInviteCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [userFarms, setUserFarms] = useState([]);
    const [farmsLoading, setFarmsLoading] = useState(false);

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

    const fetchUserFarms = useCallback(async () => {
        setFarmsLoading(true);
        try {
            const res = await api.get('/farms/');
            setUserFarms(res.data.results || res.data || []);
        } catch (err) {
            console.error('Error fetching farms:', err);
        } finally {
            setFarmsLoading(false);
        }
    }, [api]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory(1);
        } else if (activeTab === 'farms') {
            fetchUserFarms();
        }
    }, [activeTab, fetchHistory, fetchUserFarms]);

    const startTutorial = useCallback(() => {
        const driverObj = driver({
            popoverClass: 'misspelt-driver-popover pixel-rendering',
            showProgress: true,
            // Sin esto driver.js rotula "1 of 3" en ingles.
            progressText: '{{current}} de {{total}}',
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

    const handleJoinFarm = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        setJoinLoading(true);
        try {
            const res = await api.post('/farms/join/', { invite_code: inviteCode.trim() });
            toast.success('¡Granja unida!', { description: res.data.status + (res.data.farm_name ? ` (${res.data.farm_name})` : '') });
            setInviteCode('');
            if (activeTab === 'farms') fetchUserFarms();
        } catch (err) {
            toast.error('Error', { description: err.response?.data?.error || 'Código inválido.' });
        } finally {
            setJoinLoading(false);
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
            <main id="main-content" className="min-h-screen bg-background flex flex-col">
                <div role="status" aria-live="polite" className="flex-1 flex flex-col items-center justify-center gap-4 mt-16">
                    <div aria-hidden="true" className="w-16 h-16 border-4 border-accent-strong border-t-transparent motion-safe:animate-spin rounded-full" />
                    <p className="font-mono text-xs text-muted-foreground animate-pulse">CARGANDO PERFIL...</p>
                </div>
            </main>
        );
    }

    if (error || !userStats) {
        return (
            <main id="main-content" className="min-h-screen bg-background flex flex-col">
                <div role="alert" className="flex-1 flex items-center justify-center mt-16">
                    <p className="text-destructive font-mono">{error || 'Sin datos.'}</p>
                </div>
            </main>
        );
    }

    const generalAccuracy = getAccuracy(userStats.correct_answers_total, userStats.total_questions_answered);
    const slangAccuracy = getAccuracy(userStats.correct_slangs, userStats.slangs_seen);
    const pvAccuracy = getAccuracy(userStats.correct_phrasal_verbs, userStats.phrasal_verbs_seen);
    const currentAvatarObj = userStats.unlocked_avatars?.find(a => a.id === profileData?.current_avatar);
    const avatarSrc = currentAvatarObj?.image || `https://ui-avatars.com/api/?name=${userStats.user_username}&background=random`;

    return (
        <main id="main-content" className="min-h-screen bg-background font-sans flex flex-col">
            <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12 mt-16">

                <ProfileHeader
                    userStats={userStats}
                    profileData={profileData}
                    isEditing={isEditing}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saving={saving}
                    avatarSrc={avatarSrc}
                    onStartEditing={handleStartEditing}
                    onSaveProfile={handleSaveProfile}
                    onCancelEdit={() => setIsEditing(false)}
                />

                <JoinFarmWidget
                    inviteCode={inviteCode}
                    setInviteCode={setInviteCode}
                    joinLoading={joinLoading}
                    onSubmit={handleJoinFarm}
                />

                {/* ═══════════ TABS ═══════════ */}
                <div id="tutorial-tabs" className="flex border-b-2 border-foreground/20 mb-6 overflow-x-auto">
                    <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
                        Estadísticas
                    </TabButton>
                    <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                        Historial
                    </TabButton>
                    <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')}>
                        Vitrina de Insignias
                    </TabButton>
                    <TabButton active={activeTab === 'farms'} onClick={() => setActiveTab('farms')}>
                        Granjas
                    </TabButton>
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
                        Ajustes
                    </TabButton>
                </div>

                {/* ═══════════ TAB CONTENT ═══════════ */}

                {activeTab === 'settings' && (
                    <div className="space-y-6 max-w-2xl">
                        <ThemeSelector />
                    </div>
                )}

                {activeTab === 'stats' && (
                    <StatsTab
                        userStats={userStats}
                        generalAccuracy={generalAccuracy}
                        slangAccuracy={slangAccuracy}
                        pvAccuracy={pvAccuracy}
                        formatTime={formatTime}
                    />
                )}

                {activeTab === 'history' && (
                    <HistoryTab
                        historyLoading={historyLoading}
                        gameHistory={gameHistory}
                        historyCount={historyCount}
                        historyPage={historyPage}
                        historyPrev={historyPrev}
                        historyNext={historyNext}
                        onFetchHistory={fetchHistory}
                        getAccuracy={getAccuracy}
                        formatTime={formatTime}
                        formatDate={formatDate}
                    />
                )}

                {activeTab === 'badges' && (
                    <BadgesTab badges={userStats.unlocked_badges} />
                )}

                {activeTab === 'farms' && (
                    <FarmsTab farmsLoading={farmsLoading} userFarms={userFarms} />
                )}

            </div>
            <button
                onClick={startTutorial}
                aria-label="Ver tutorial de nuevo"
                className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-accent-foreground pixel-border flex items-center justify-center text-2xl hover:scale-110 transition-transform z-dropdown shadow-pixel-md hover:shadow-pixel-lg"
                title="Ver Tutorial de Nuevo"
            >
                <span className="font-mono text-3xl pb-1" aria-hidden="true">?</span>
            </button>
        </main>
    );
}

export default ProfilePage;
