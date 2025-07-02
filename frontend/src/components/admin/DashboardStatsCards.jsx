import React, { useEffect, useState, useCallback } from 'react';
import useAxios from '@/utils/useAxios';
import { useTheme } from '@/context/ThemeContext';
import { Users, UserPlus, FileText, Award } from 'lucide-react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function DashboardStatsCards() {
    const api = useAxios();
    const { theme } = useTheme();

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
            const response = await api.get('/admin/dashboard-data/');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            if (axios.isCancel(err) || err.code === 'ECONNABORTED') {
                console.log("Request aborted, not setting error state.");
            } else {
                setError("No se pudieron cargar las estadísticas del dashboard.");
            }
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const activeUsersChartData = {
        labels: ['Usuarios Activos'],
        datasets: [
            {
                label: 'Cantidad',
                data: [stats.active_users, stats.total_users],
                backgroundColor: theme === 'light' ? '#ff7795' : '#00d5be',
                borderColor: theme === 'light' ? '#ff7795' : '#00d5be',
                borderWidth: 1,
            },
        ],
    };

    const activeUsersChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)',
                titleColor: theme === 'light' ? '#fff' : '#000',
                bodyColor: theme === 'light' ? '#fff' : '#000',
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    borderColor: theme === 'light' ? '#9f9f9f' : '#4a4a4a',
                    color: theme === 'light' ? '#9f9f9f' : '#4a4a4a',
                },
                ticks: {
                    color: theme === 'light' ? '#9f9f9f' : '#a0a0a0',
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    borderColor: theme === 'light' ? '#9f9f9f' : '#4a4a4a',
                    color: theme === 'light' ? '#9f9f9f' : '#4a4a4a',
                },
                ticks: {
                    color: theme === 'light' ? '#9f9f9f' : '#a0a0a0',
                }
            },
        },
    };

    if (loading) {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-lg
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <p className="col-span-full text-[var(--color-text-main)]">Cargando estadísticas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-lg
                ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
                <p className="col-span-full text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-lg
            ${theme === 'light' ? 'bg-[var(--color-body-bg)]' : 'bg-[var(--color-dark-bg-main)]'}`}>
            {/* Tarjeta de Total de Usuarios */}
            <div className={`flex flex-col p-4 rounded-lg shadow-md transition-colors
                ${theme === 'light' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-main)]' : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)]'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Total de Usuarios</h3>
                    <Users className="w-6 h-6 text-[var(--color-bg-secondary)]" />
                </div>
                <p className="text-3xl font-bold">{stats.total_users}</p>
            </div>

            {/* Tarjeta de Usuarios Activos (con gráfico de Chart.js) */}
            <div className={`flex flex-col p-4 rounded-lg shadow-md transition-colors
                ${theme === 'light' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-main)]' : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)]'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Usuarios Activos</h3>
                    <UserPlus className="w-6 h-6 text-[var(--color-accent-green)]" />
                </div>
                <p className="text-3xl font-bold">{stats.active_users}</p>
                <div style={{ height: '100px', width: '100%', marginTop: '10px' }}>
                    <Bar data={activeUsersChartData} options={activeUsersChartOptions} />
                </div>
            </div>

            {/* Tarjeta de Total de Palabras */}
            <div className={`flex flex-col p-4 rounded-lg shadow-md transition-colors
                ${theme === 'light' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-main)]' : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)]'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Total de Palabras</h3>
                    <FileText className="w-6 h-6 text-[var(--color-bg-tertiary)]" />
                </div>
                <p className="text-3xl font-bold">{stats.total_words}</p>
            </div>

            {/* Tarjeta de Total de Insignias */}
            <div className={`flex flex-col p-4 rounded-lg shadow-md transition-colors
                ${theme === 'light' ? 'bg-[var(--color-bg-card)] text-[var(--color-text-main)]' : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)]'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Total de Insignias</h3>
                    <Award className="w-6 h-6 text-[var(--color-accent-blue)]" />
                </div>
                <p className="text-3xl font-bold">{stats.total_badges}</p>
            </div>
        </div>
    );
}

export default DashboardStatsCards;