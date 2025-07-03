import React, { useState, useEffect, useCallback, useContext } from 'react';
import useAxios from '@/utils/useAxios'; // Para hacer peticiones al backend
import { useTheme } from '@/context/ThemeContext'; // Para el tema claro/oscuro
import AuthContext from '@/context/AuthContext'; // Para obtener el usuario y sus stats
import { ScaleLoader } from 'react-spinners'; // Para el indicador de carga

function BadgesPage() {
    const api = useAxios(); // Hook para peticiones autenticadas
    const { theme } = useTheme(); // Tema actual
    const { user } = useContext(AuthContext); // Usuario logueado

    const [allBadges, setAllBadges] = useState([]); // Todos los badges disponibles
    const [userStats, setUserStats] = useState(null); // Estadísticas del usuario actual (para XP y contadores)
    const [loading, setLoading] = useState(true); // Estado de carga
    const [error, setError] = useState(null); // Estado de error

    // Estado para un mensaje informativo si no hay badges o stats
    const [infoMessage, setInfoMessage] = useState(null);

    const fetchBadgeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setInfoMessage(null);
        try {
            // 1. Obtener todos los badges del sistema
            const allBadgesResponse = await api.get('/badges/'); // Asume /badges/ endpoint para todos los badges
            const fetchedAllBadges = allBadgesResponse.data.results || [];
            setAllBadges(fetchedAllBadges);

            // 2. Obtener las estadísticas del usuario actual
            let currentUserStats = null;
            if (user && user.user_id) { // Asegúrate de que el usuario esté logueado y tenga user_id
                try {
                    const userStatsResponse = await api.get(`/user-stats/me/`); // <-- ¡CAMBIO CLAVE!
                    currentUserStats = userStatsResponse.data;
                    setUserStats(currentUserStats);
                } catch (userStatsErr) {
                    console.warn("No se pudieron cargar las estadísticas del usuario. Podría no tener entradas en UserStats.", userStatsErr);
                    setInfoMessage("No se encontraron estadísticas para tu usuario. Juega un poco para empezar a ganar insignias.");
                    setUserStats(null); // Asegurar que sea null si falla
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
    }, [api, user]); // user como dependencia para re-fetch si el usuario cambia

    useEffect(() => {
        fetchBadgeData();
    }, [fetchBadgeData]);

    // Función para determinar si un badge está desbloqueado y obtener su progreso
    const getBadgeStatus = (badge) => {
        if (!userStats || !userStats.unlocked_badges) {
            return { unlocked: false, progress: 0, showProgress: false }; // Si no hay stats o badges, ninguno desbloqueado
        }

        const isUnlocked = userStats.unlocked_badges.some(ub => ub.id === badge.id); //

        let progress = 0;
        let showProgress = false;

        if (isUnlocked) {
            progress = 100;
            showProgress = true; // Si está desbloqueado, mostramos 100% de progreso
        } else if (badge.unlock_condition_data && userStats) { // Si el badge tiene una condición programática
            const condition = badge.unlock_condition_data;
            const userCurrentValue = userStats[condition.type]; // Obtener el valor actual del usuario (ej. correct_slangs)
            const requiredValue = condition.value;
            
            // Asegúrate de que userCurrentValue no sea undefined/null y que requiredValue sea válido
            if (typeof userCurrentValue === 'number' && typeof requiredValue === 'number' && requiredValue > 0) {
                progress = Math.min(100, (userCurrentValue / requiredValue) * 100);
                showProgress = true; // Mostrar barra si hay condición y datos numéricos
            } else {
                progress = 0;
                showProgress = false; // No mostrar si los datos no son válidos o falta la stat
            }
        }
        return { unlocked: isUnlocked, progress: Math.floor(progress), showProgress: showProgress }; // Redondear a entero
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
                    const { unlocked, progress, showProgress } = getBadgeStatus(badge);
                    
                    // Clases para la imagen según el progreso/desbloqueo
                    const imageClasses = unlocked 
                        ? '' // Desbloqueado: color completo
                        : (progress > 0 ? '' : 'grayscale opacity-70'); // Con progreso: color; Sin progreso: gris/opaco

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
                                    src={badge.image} // URL completa de la imagen del badge
                                    alt={badge.title}
                                    className={`w-full h-full object-contain transition-all duration-300 ${imageClasses}`} // Aplica las clases de la imagen
                                />
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
                                {unlocked ? badge.reward_description : badge.condition_description}
                            </p>

                            {/* Barra de Progreso */}
                            {showProgress && ( // Mostrar progreso solo si `showProgress` es true
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-auto">
                                    <div
                                        className="bg-[var(--color-accent-blue)] h-2.5 rounded-full transition-all duration-500"
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