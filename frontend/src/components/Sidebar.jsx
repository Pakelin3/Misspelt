import React from 'react';
import { BookA, Gem, ChartColumnBig } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext'; // Importa el hook useTheme

function Sidebar() {
    const { theme } = useTheme(); // Obtiene el tema actual

    return (
        <>
            <button
                data-drawer-target="separator-sidebar"
                data-drawer-toggle="separator-sidebar"
                aria-controls="separator-sidebar"
                type="button"
                className={`inline-flex items-center p-2 mt-2 ms-3 text-sm rounded-lg sm:hidden focus:outline-none focus:ring-2
                    ${theme === 'light'
                        ? 'bg-[var(--color-bg-secondary)] text-white hover:bg-[var(--color-bg-main)] focus:ring-[var(--color-text-secondary)]'
                        : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)] focus:ring-[var(--color-dark-text-secondary)]'
                    }`}
            >
                <span className="sr-only">Open sidebar</span>
                <svg
                    className={`w-6 h-6 ${theme === 'light' ? 'text-white' : 'text-white'}`} // El icono de SVG debe adaptarse
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
            </button>
            <aside
                id="separator-sidebar"
                className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full sm:translate-x-0
                    ${theme === 'light'
                        ? 'bg-[var(--color-navbar-bg)] border-r border-[var(--color-text-secondary)]'
                        : 'bg-[var(--color-dark-bg-secondary)] border-r border-[var(--color-dark-border)]'}`}
                aria-label="Sidebar"
            >
                <div className={`h-full px-3 py-4 overflow-y-auto 
                    ${theme === 'light' ? 'bg-[var(--color-bg-card)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
                    <ul className="space-y-2 font-medium">
                        <li>
                            <a
                                href="#"
                                className={`flex items-center p-2 rounded-lg group
                                    ${theme === 'light'
                                        ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                        : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]'}`}>
                                <ChartColumnBig className={`w-5 h-5 transition duration-75 
                                    ${theme === 'light'
                                        ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                        : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]'}`} />
                                <span className="ms-3">Dashboard</span>
                            </a>
                        </li>
                    </ul>
                    <ul className={`pt-4 mt-4 space-y-2 font-medium border-t 
                        ${theme === 'light' ? 'border-[var(--color-text-secondary)]' : 'border-[var(--color-dark-border)]'}`}>
                        <li>
                            <a
                                href="#"
                                className={`flex items-center p-2 rounded-lg group
                                    ${theme === 'light'
                                        ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                        : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]'}`}>
                                <BookA className={`w-5 h-5 transition duration-75 
                                    ${theme === 'light'
                                        ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                        : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]'}`} />
                                <span className="ms-3">Diccionario</span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className={`flex items-center p-2 rounded-lg group
                                    ${theme === 'light'
                                        ? 'text-[var(--color-text)] hover:bg-[var(--color-bg-main)]'
                                        : 'text-[var(--color-dark-text)] hover:bg-[var(--color-dark-bg-tertiary)]'}`}>
                                <Gem className={`w-5 h-5 transition duration-75 
                                    ${theme === 'light'
                                        ? 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]'
                                        : 'text-[var(--color-dark-text-secondary)] group-hover:text-[var(--color-dark-text)]'}`} />
                                <span className="ms-3">Insignias</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </aside >
        </>
    )
}

export default Sidebar;