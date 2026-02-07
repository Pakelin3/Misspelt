import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

// Iconos
import { 
    LayoutDashboard, 
    BookType, 
    Medal, 
    UserSquare2, 
    LogOut, 
    Menu, 
    X,
    Gamepad2,
    ChevronRight
} from 'lucide-react';

// Componentes Admin Existentes
import DashboardStatsCards from '@/components/admin/DashboardStatsCards';
import DictionaryAdminPanel from '@/components/admin/DictionaryAdminPanel';
import BadgesAdminPanel from '@/components/admin/BadgesAdminPanel';
import AvatarAdminPanel from '@/components/admin/AvatarAdminPanel';

// Componentes UI (Reusando los que ya traducimos)
import { Button } from '@/components/ui/Button';

// --- CONFIGURACIÓN DEL MENÚ ADMIN ---
const ADMIN_MENU = [
    { 
        title: 'Dashboard', 
        path: '/admin-dashboard', 
        icon: LayoutDashboard,
        description: 'Estadísticas generales'
    },
    { 
        title: 'Diccionario', 
        path: '/admin-dashboard/words', 
        icon: BookType,
        description: 'Gestionar palabras y slangs'
    },
    { 
        title: 'Insignias', 
        path: '/admin-dashboard/badges', 
        icon: Medal,
        description: 'Logros y recompensas'
    },
    { 
        title: 'Avatares', 
        path: '/admin-dashboard/avatars', 
        icon: UserSquare2,
        description: 'Personalización de usuarios'
    }
];

// --- COMPONENTE: SIDEBAR LINK ---
const AdminSidebarLink = ({ item, isActive, isCollapsed, onClick }) => {
    return (
        <Link
            to={item.path}
            onClick={onClick}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group
                ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
            `}
        >
            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
            
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>
            </div>
            
            {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
            )}
        </Link>
    );
};

// --- LAYOUT PRINCIPAL ---
function AdminDashboard() {
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true); // Desktop
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile

    // Determinar título actual basado en la ruta
    const currentRoute = ADMIN_MENU.find(item => item.path === location.pathname) || ADMIN_MENU[0];

    return (
        <div className="min-h-screen bg-muted/20 flex font-sans">
            
            {/* --- SIDEBAR DESKTOP --- */}
            <aside 
                className={`
                    hidden md:flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-300 z-20
                    ${isSidebarOpen ? 'w-64' : 'w-16'}
                `}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 border-b">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center shrink-0">
                            <span className="font-mono text-xs text-primary-foreground">WF</span>
                        </div>
                        <span className={`font-mono text-sm font-bold whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            ADMIN PANEL
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                <div className="p-3 border-t space-y-2">
                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        title={isSidebarOpen ? "Colapsar menú" : "Expandir menú"}
                    >
                        {isSidebarOpen ? <ChevronRight className="rotate-180 w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    
                    <Link 
                        to="/"
                        className={`
                            flex items-center gap-3 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors
                            ${!isSidebarOpen && 'justify-center'}
                        `}
                        title="Volver al Juego"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className={`${!isSidebarOpen && 'hidden'} font-medium text-sm`}>Salir</span>
                    </Link>
                </div>
            </aside>


            {/* --- SIDEBAR MOBILE (Overlay) --- */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-card p-4 shadow-xl animate-in slide-in-from-left">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-mono text-lg font-bold">MENÚ ADMIN</span>
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X className="w-6 h-6 text-muted-foreground" />
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
                            <div className="my-4 border-t" />
                            <Link to="/" className="flex items-center gap-3 px-3 py-2 text-destructive font-medium">
                                <LogOut className="w-5 h-5" /> Salir del Panel
                            </Link>
                        </nav>
                    </div>
                </div>
            )}


            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* Top Header */}
                <header className="h-16 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-10 px-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            className="md:hidden p-2 -ml-2 text-muted-foreground"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        
                        <div className="flex flex-col">
                            <h1 className="text-lg font-semibold leading-none tracking-tight">
                                {currentRoute.title}
                            </h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                {currentRoute.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            className="hidden sm:flex gap-2"
                            onClick={() => navigate('/')}
                        >
                            <Gamepad2 className="w-4 h-4" />
                            Volver al Juego
                        </Button>
                    </div>
                </header>

                {/* Content Wrapper */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-6xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-card rounded-lg p-10 border shadow-sm min-h-[500px]">
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