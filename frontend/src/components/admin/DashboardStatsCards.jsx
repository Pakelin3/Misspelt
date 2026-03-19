import React, { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import useAxios from '@/utils/useAxios';
import axios from 'axios';
import { PixelFireIcon } from '@/components/PixelIcons';
import { VillagerIcon, SignalIcon, ScrollIcon, MedalRibbonIcon } from '@/components/AdminPixelIcons';
import { BrainIcon } from '@/components/PixelIcons';

const LazyBar = lazy(() => Promise.all([
    import('chart.js'),
    import('react-chartjs-2')
]).then(([chartJs, reactChartJs]) => {
    chartJs.Chart.register(
        chartJs.CategoryScale,
        chartJs.LinearScale,
        chartJs.BarElement,
        chartJs.Title,
        chartJs.Tooltip
    );
    return { default: reactChartJs.Bar };
}));

const StatCard = ({ title, value, icon: Icon, colorClass, children }) => (
    <div className={`
        relative bg-card pixel-border p-6 flex flex-col justify-between 
        min-h-[140px] overflow-hidden group hover:-translate-y-1 transition-transform
    `}>
        <div className="flex justify-between items-start z-10">
            <div>
                <div className='flex justify-center items-center'>
                    <h3 className="font-mono text-xs mr-2.5 text-muted-foreground uppercase mb-1 tracking-wider">
                        {title}
                    </h3>
                    <div className={` min-h-10 min-w-10 flex items-center-safe justify-center bg-background rounded-sm border-2 border-foreground ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>

                <p className="font-sans text-4xl text-foreground font-bold">
                    {value}
                </p>
            </div>
        </div>

        <div className={`
            absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 
            transition-all group-hover:scale-110 rotate-12
            ${colorClass}
        `}>
            <Icon className="w-24 h-24" />
        </div>

        {children && <div className="mt-4 z-10 relative">{children}</div>}
    </div>
);

function DashboardStatsCards() {
    const api = useAxios();

    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        total_words: 0,
        total_badges: 0,
    });

    const [leaderboard, setLeaderboard] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const statsResp = await api.get('/dashboard-data/');
            setStats(statsResp.data);

            try {
                const usersResp = await api.get('/leaderboard/');
                const allStats = Array.isArray(usersResp.data) ? usersResp.data : (usersResp.data.results || []);
                setLeaderboard(allStats.slice(0, 5));
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
            }

            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            if (!axios.isCancel(err) && err.code !== 'ECONNABORTED') {
                setError("Error de conexión con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activeUsersChartData = {
        labels: ['Activos', 'Total'],
        datasets: [
            {
                label: 'Usuarios',
                data: [stats.active_users, stats.total_users],
                backgroundColor: ['hsl(100 38% 35%)', 'hsl(28 45% 65%)'],
                borderColor: 'hsl(20 36% 18%)',
                borderWidth: 2,
                barThickness: 20,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'hsl(20 36% 18%)',
                titleFont: { family: 'VT323', size: 14 },
                bodyFont: { family: 'VT323', size: 14 },
                displayColors: false,
                padding: 8,
                cornerRadius: 0,
            }
        },
        scales: {
            x: { display: false },
            y: { display: false, min: 0 },
        },
        layout: { padding: 0 }
    };



    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={`loading-skeleton-${i}`} className="bg-card/50 h-36 pixel-border animate-pulse flex items-center justify-center">
                        <span className="font-mono text-xs text-muted-foreground">CARGANDO...</span>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 pixel-border border-destructive p-6 text-center">
                <p className="font-mono text-destructive text-sm">{error}</p>
                <button onClick={fetchData} className="mt-4 text-xs underline font-sans text-foreground">
                    Reintentar
                </button>
            </div>
        );
    }


    const engagementRate = stats.total_users > 0
        ? Math.round((stats.active_users / stats.total_users) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <h2 className="font-mono text-xl text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-primary block"></span>
                ESTADÍSTICAS DEL REINO
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Total Usuarios */}
                <StatCard
                    title="Población Total"
                    value={stats.total_users}
                    icon={VillagerIcon}
                    colorClass="text-foreground"
                />

                {/* 2. Usuarios Activos (Con gráfico) */}
                <StatCard
                    title="Granjeros Activos"
                    value={stats.active_users}
                    icon={SignalIcon}
                    colorClass="text-primary"
                >
                    <div className="h-12 w-full mt-1 opacity-80">
                        <Suspense fallback={<div className="font-mono text-[10px] text-muted-foreground w-full h-full flex items-center justify-center">Cargando gráfico...</div>}>
                            <LazyBar data={activeUsersChartData} options={chartOptions} />
                        </Suspense>
                    </div>
                </StatCard>

                {/* 3. Total Palabras */}
                <StatCard
                    title="Palabras Descubiertas"
                    value={stats.total_words}
                    icon={ScrollIcon}
                    colorClass="text-secondary-foreground"
                />

                {/* 4. Total Insignias */}
                <StatCard
                    title="Medallas Otorgadas"
                    value={stats.total_badges}
                    icon={MedalRibbonIcon}
                    colorClass="text-accent"
                />

                {/* 5. Carta Extra: Engagement */}
                <StatCard
                    title="Tasa de Actividad"
                    value={`${engagementRate}%`}
                    icon={BrainIcon}
                    colorClass="text-muted-foreground"
                />

            </div>

            {/* Leaderboard */}
            <div className="mt-8">
                <h2 className="font-mono text-xl text-foreground mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-yellow-500 block"></span>
                    MEJORES GRANJEROS (TOP 5)
                </h2>
                <div className="bg-card pixel-border p-6 overflow-x-auto">
                    {leaderboard.length === 0 ? (
                        <p className="text-muted-foreground font-mono text-center py-4">No hay datos de usuarios aún.</p>
                    ) : (
                        <table className="w-full text-left font-mono">
                            <thead>
                                <tr className="border-b-2 border-foreground text-muted-foreground text-sm uppercase">
                                    <th className="pb-3 px-4">#</th>
                                    <th className="pb-3 px-4">Usuario</th>
                                    <th className="pb-3 px-4">Destrezas</th>
                                    <th className="pb-3 px-4 text-right">XP</th>
                                    <th className="pb-3 px-4 text-right">Racha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((userStat, index) => (
                                    <tr key={userStat.id} className="border-b border-foreground/20 hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 font-bold text-lg">
                                            {index + 1}
                                            {index === 0 && <span className="text-yellow-500 ml-1">★</span>}
                                            {index === 1 && <span className="text-gray-400 ml-1">★</span>}
                                            {index === 2 && <span className="text-amber-700 ml-1">★</span>}

                                        </td>
                                        <td className="py-3 px-4 font-bold text-primary">{userStat.user_username || `User ${userStat.id}`}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-sm text-xs w-max">
                                                    Lvl {userStat.level}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {userStat.true_accuracy}% Efectividad • {userStat.unlocked_count} p.
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-right text-muted-foreground">{userStat.experience.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right text-muted-foreground">
                                            {userStat.current_streak > 0 ? (
                                                <span className="text-orange-500 flex items-center justify-end gap-1 font-bold">
                                                    {userStat.current_streak}<PixelFireIcon />
                                                </span>
                                            ) : (
                                                <span className="opacity-50">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardStatsCards;