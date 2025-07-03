import React, { useState, useEffect, useRef } from 'react';
import { BookA, Gem, ChartColumnBig, X, CircleUser } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
    const { theme } = useTheme();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSidebarOpen]);

    // Función auxiliar para determinar si un enlace está activo
    const isActive = (path) => location.pathname === path;

    return (
        <>
            <button
                type="button"
                onClick={toggleSidebar}
                className={`inline-flex items-center justify-center p-2 mt-2 ms-3 text-sm rounded-lg sm:hidden focus:outline-none focus:ring-2 w-10 h-10
                    ${theme === 'light'
                        ? 'bg-[var(--color-bg-secondary)] text-white hover:bg-[var(--color-bg-main)] focus:ring-[var(--color-text-secondary)]'
                        : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)] focus:ring-[var(--color-dark-text-secondary)]'
                    }`}
            >
                {isSidebarOpen ? (
                    <X className={`w-6 h-6 ${theme === 'light' ? 'text-white' : 'text-white'}`} />
                ) : (
                    <svg
                        className={`w-6 h-6 ${theme === 'light' ? 'text-white' : 'text-white'}`}
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            clipRule="evenodd"
                            fillRule="evenodd"
                            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                        />
                    </svg>
                )}
            </button>
            <aside
                id="separator-sidebar"
                ref={sidebarRef}
                className={`z-40 w-64 h-screen transition-transform 
                    ${
                        isSidebarOpen
                            ? 'fixed left-0 translate-x-0'
                            : 'fixed left-0 -translate-x-full'
                    }
                    sm:translate-x-0 sm:static sm:h-auto  sm:border-r 
                    ${theme === 'light'
                        ? 'bg-[var(--color-navbar-bg)] border-[var(--color-text-secondary)]'
                        : 'bg-[var(--color-dark-bg-secondary)] border-[var(--color-dark-border)]'}`}
                aria-label="Sidebar"
            >
                <div className={`h-full px-3 py-4 overflow-y-auto 
                    ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
                    <ul className="space-y-2 font-medium">
                        <li>
                            <Link
                                to="/admin-dashboard"
                                className={`flex items-center p-2 rounded-lg group ${
                                    isActive("/admin-dashboard")
                                        ? (theme === 'light'
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)]'
                                            : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                            : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]')
                                }`}
                            >
                                <ChartColumnBig className={`w-5 h-5 transition duration-75 
                                    ${isActive("/admin-dashboard")
                                        ? (theme === 'light'
                                            ? 'text-[var(--color-body-bg)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text)] group-hover:text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]')
                                    }`} />
                                <span className="ms-3">Dashboard</span>
                            </Link>
                        </li>
                    </ul>
                    <ul className={`pt-4 mt-4 space-y-2 font-medium border-t 
                        ${theme === 'light' ? 'border-[var(--color-text-secondary)]' : 'border-[var(--color-dark-border)]'}`}>
                        <li>
                            <Link
                                to="/admin-dashboard/words"
                                className={`flex items-center p-2 rounded-lg group
                                    ${isActive("/admin-dashboard/words")
                                        ? (theme === 'light'
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)]'
                                            : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                            : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]')
                                    }`}>
                                <BookA className={`w-5 h-5 transition duration-75 
                                    ${isActive("/admin-dashboard/words")
                                        ? (theme === 'light'
                                            ? 'text-[var(--color-body-bg)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text)] group-hover:text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]')
                                    }`} />
                                <span className="ms-3">Diccionario</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin-dashboard/badges"
                                className={`flex items-center p-2 rounded-lg group
                                    ${isActive("/admin-dashboard/badges")
                                        ? (theme === 'light'
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)]'
                                            : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                            : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]')
                                    }`}>
                                <Gem className={`w-5 h-5 transition duration-75 
                                    ${isActive("/admin-dashboard/badges")
                                        ? (theme === 'light'
                                            ? 'text-[var(--color-body-bg)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text)] group-hover:text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]')
                                    }`} />
                                <span className="ms-3">Insignias</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/admin-dashboard/avatars"
                                className={`flex items-center p-2 rounded-lg group
                                    ${isActive("/admin-dashboard/avatars")
                                        ? (theme === 'light'
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-body-bg)]'
                                            : 'bg-[var(--color-dark-bg-tertiary)] text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                            : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]')
                                    }`}>
                                <CircleUser  className={`w-5 h-5 transition duration-75 
                                    ${isActive("/admin-dashboard/avatars")
                                        ? (theme === 'light'
                                            ? 'text-[var(--color-body-bg)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text)] group-hover:text-[var(--color-dark-text)]')
                                        : (theme === 'light'
                                            ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                            : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]')
                                    }`} />
                                <span className="ms-3">Avatares</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            </aside >
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 sm:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}
        </>
    )
}

export default Sidebar;