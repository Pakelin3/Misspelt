import React, { useEffect, useState, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Importamos los iconos pixelados
import { VillagerIcon, SignalIcon, ScrollIcon, MedalRibbonIcon } from '@/components/AdminPixelIcons';
// Importamos icono genérico para la carta extra
import { BrainIcon } from '@/components/PixelIcons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

function DashboardStatsCards() {
    const api = useAxios();

    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        total_words: 0,
        total_badges: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/dashboard-data/');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            if (!axios.isCancel(err) && err.code !== 'ECONNABORTED') {
                setError("Error de conexión con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Configuración del Gráfico (Minimalista y Pixelado)
    const activeUsersChartData = {
        labels: ['Activos', 'Total'],
        datasets: [
            {
                label: 'Usuarios',
                data: [stats.active_users, stats.total_users],
                // Usamos variables CSS para los colores
                backgroundColor: ['hsl(100 38% 35%)', 'hsl(28 45% 65%)'], // Primary y Secondary
                borderColor: 'hsl(20 36% 18%)', // Foreground
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
                cornerRadius: 0, // Borde cuadrado
            }
        },
        scales: {
            x: { display: false },
            y: { display: false, min: 0 },
        },
        layout: { padding: 0 }
    };

    // Componente interno para la Tarjeta de Estadística
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

            {/* Icono decorativo grande en el fondo */}
            <div className={`
                absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 
                transition-all group-hover:scale-110 rotate-12
                ${colorClass}
            `}>
                <Icon className="w-24 h-24" />
            </div>

            {/* Icono pequeño superior */}


            {/* Espacio para contenido extra (gráficos) */}
            {children && <div className="mt-4 z-10 relative">{children}</div>}
        </div>
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card/50 h-36 pixel-border animate-pulse flex items-center justify-center">
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
                <button onClick={fetchStats} className="mt-4 text-xs underline font-sans text-foreground">
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
                        <Bar data={activeUsersChartData} options={chartOptions} />
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

                {/* 5. Carta Extra: Engagement (Opcional, si quieres llenar espacio o dar más data) */}
                <StatCard
                    title="Tasa de Actividad"
                    value={`${engagementRate}%`}
                    icon={BrainIcon}
                    colorClass="text-muted-foreground"
                />

            </div>
        </div>
    );
}

export default DashboardStatsCards;