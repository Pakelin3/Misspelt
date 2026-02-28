import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { BookIcon, SwordIcon } from '@/components/PixelIcons';
import { VillagerIcon, SignalIcon, MedalRibbonIcon } from '@/components/AdminPixelIcons';
import { LogOut, Menu, X, ChevronRight } from 'lucide-react';
import DashboardStatsCards from '@/components/admin/DashboardStatsCards';
import DictionaryAdminPanel from '@/components/admin/DictionaryAdminPanel';
import BadgesAdminPanel from '@/components/admin/BadgesAdminPanel';
import AvatarAdminPanel from '@/components/admin/AvatarAdminPanel';
import { Button } from '@/components/ui/Button';


const ADMIN_MENU = [
    {
        title: 'Dashboard',
        path: '/admin-dashboard',
        icon: SignalIcon, // Icono de reporte/estadísticas
        description: 'Estadísticas generales'
    },
    {
        title: 'Diccionario',
        path: '/admin-dashboard/words',
        icon: BookIcon, // Libro pixelado
        description: 'Gestionar palabras'
    },
    {
        title: 'Insignias',
        path: '/admin-dashboard/badges',
        icon: MedalRibbonIcon, // Medalla pixelada
        description: 'Logros y premios'
    },
    {
        title: 'Avatares',
        path: '/admin-dashboard/avatars',
        icon: VillagerIcon, // Aldeano pixelado
        description: 'Usuarios y skins'
    }
];

// --- COMPONENTE: SIDEBAR LINK ---
const AdminSidebarLink = ({ item, isActive, isCollapsed, onClick }) => {
    return (
        <Link
            to={item.path}
            onClick={onClick}
            className={`
                flex items-center gap-3 px-3 py-3 mx-2 my-1 rounded-sm transition-all duration-100 group font-sans text-lg
                ${isActive
                    ? 'bg-primary text-primary-foreground pixel-border-primary translate-x-1'
                    : 'text-foreground hover:bg-muted hover:translate-x-1'
                }
            `}
        >
            <div className="shrink-0">
                <item.icon className={`w-6 h-6 ${isActive ? 'text-primary-foreground' : 'text-foreground'}`} />
            </div>

            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="leading-none pt-1">{item.title}</span>
            </div>
        </Link>
    );
};

// --- LAYOUT PRINCIPAL ---
function AdminDashboard() {
    // const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true); // Desktop
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile

    // Determinar título actual
    const currentRoute = ADMIN_MENU.find(item => item.path === location.pathname) || ADMIN_MENU[0];

    return (
        <div className="min-h-screen bg-background flex font-sans pt-[72px]"> {/* pt-[72px] para compensar el Navbar global */}

            {/* --- SIDEBAR DESKTOP --- */}
            <aside
                className={`
                    hidden md:flex flex-col border-r-4 border-foreground bg-card h-[calc(100vh-72px)] sticky top-[72px] transition-all duration-300 z-20
                    ${isSidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                {/* Header del Sidebar */}
                <div className="h-16 flex items-center justify-center border-b-4 border-foreground bg-muted/30">
                    <div className={`flex items-center gap-2 overflow-hidden ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 bg-destructive rounded-sm flex items-center justify-center shrink-0 pixel-border border-2 border-foreground">
                            <span className="font-mono text-[10px] text-white font-bold">OP</span>
                        </div>
                        <span className={`font-mono text-xs font-bold whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'hidden'}`}>
                            PANEL OP
                        </span>
                    </div>
                </div>

                {/* Navegación */}
                <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                    {ADMIN_MENU.map((item) => (
                        <AdminSidebarLink
                            key={item.path}
                            item={item}
                            isActive={location.pathname === item.path}
                            isCollapsed={!isSidebarOpen}
                        />
                    ))}
                </nav>

                {/* Footer Sidebar */}
                <div className="p-2 border-t-4 border-foreground bg-muted/30">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 text-foreground hover:bg-muted rounded-sm transition-colors mb-2"
                        title={isSidebarOpen ? "Colapsar" : "Expandir"}
                    >
                        {isSidebarOpen ? <ChevronRight className="rotate-180 w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                    </button>

                    {isSidebarOpen && (
                        <div className="px-2 pb-2">
                            <div className="text-[10px] font-mono text-center text-muted-foreground opacity-70">
                                v1.0.4-BETA
                            </div>
                        </div>
                    )}
                </div>
            </aside>


            {/* --- SIDEBAR MOBILE (Overlay) --- */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden pt-[72px]">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-[72px] bottom-0 w-3/4 max-w-xs bg-card border-r-4 border-foreground p-4 shadow-xl animate-in slide-in-from-left">
                        <div className="flex justify-between items-center mb-6 border-b-4 border-muted pb-4">
                            <span className="font-mono text-sm font-bold">PANEL ADMIN</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="pixel-btn">
                                <X className="w-6 h-6 text-foreground" />
                            </button>
                        </div>
                        <nav className="space-y-2">
                            {ADMIN_MENU.map((item) => (
                                <AdminSidebarLink
                                    key={item.path}
                                    item={item}
                                    isActive={location.pathname === item.path}
                                    isCollapsed={false}
                                    onClick={() => setMobileMenuOpen(false)}
                                />
                            ))}
                        </nav>
                    </div>
                </div>
            )}


            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">

                {/* Sub-Header del Panel */}
                <header className="h-16 border-b-4 border-foreground bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 -ml-2 text-foreground pixel-btn"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col justify-center">
                            <h1 className="text-sm md:text-base font-mono font-bold leading-none uppercase tracking-wider">
                                {currentRoute.title}
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block font-sans">
                                {currentRoute.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex gap-2 font-mono text-xs pixel-btn rounded-none border-2 border-foreground"
                            onClick={() => navigate('/')}
                        >
                            <SwordIcon className="w-4 h-4" />
                            VOLVER
                        </Button>
                    </div>
                </header>

                {/* Wrapper del Contenido */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300">
                        {/* Contenedor tipo tarjeta pixelada */}
                        <div className="bg-card pixel-border p-6 sm:p-8 min-h-[500px] relative">
                            {/* Decoración esquinas (opcional, estilo retro) */}
                            <div className="absolute top-2 left-2 w-2 h-2 bg-foreground/20" />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-foreground/20" />
                            <div className="absolute bottom-2 left-2 w-2 h-2 bg-foreground/20" />
                            <div className="absolute bottom-2 right-2 w-2 h-2 bg-foreground/20" />

                            <Routes>
                                <Route index element={<DashboardStatsCards />} />
                                <Route path="words" element={<DictionaryAdminPanel />} />
                                <Route path="badges" element={<BadgesAdminPanel />} />
                                <Route path="avatars" element={<AvatarAdminPanel />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;