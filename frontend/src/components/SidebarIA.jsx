import React, { useState, useEffect } from 'react';
import { X, Settings, Plus, Search, Layers, UploadCloud } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

function SidebarIA({ isOpen, toggleSidebar }) {
    const { theme } = useTheme();
    const NAVBAR_HEIGHT_DESKTOP = '64px';
    const NAVBAR_HEIGHT_MOBILE = '64px';

    const [currentNavbarHeight, setCurrentNavbarHeight] = useState(NAVBAR_HEIGHT_DESKTOP);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setCurrentNavbarHeight(NAVBAR_HEIGHT_MOBILE);
            } else {
                setCurrentNavbarHeight(NAVBAR_HEIGHT_DESKTOP);
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className={`
                p-4 transition-all duration-300 ease-in-out h- z-30 flex flex-col
                fixed inset-y-0 left-0 border-r 
                ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}
                md:w-64 md:sticky md:h-full md:flex-shrink-0 md:p-4
                ${theme === 'light'
                    ? 'bg-[var(--color-bg-main-darker)] text-[var(--color-text-main)] border-[var(--color-text-secondary)]' 
                    : 'bg-[var(--color-dark-bg-secondary)] text-[var(--color-dark-text)] border-[var(--color-dark-border)]'
                }
            `}
            style={{
                top: currentNavbarHeight,
                height: `calc(100vh - ${currentNavbarHeight})`,
                left: isOpen ? '0' : '-100%',
            }}
        >
            
            <div className="flex items-center mb-6 md:hidden">
                <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-full ${theme === 'light' ? 'hover:bg-neutral-200 hover:text-red-500' : 'hover:bg-[var(--color-dark-bg-tertiary)] hover:text-red-500'}`}
                >
                    <X className="w-6 h-6  " />
                </button>
                <span className="text-xl font-bold">Gemini-Clone</span>
            </div>

                <div className={`${isOpen ? '' : 'hidden md:flex flex-col flex-1 '}`}>
                    <button className={`flex items-center w-full px-2 py-2 mb-4 rounded-full transition-colors gap-2
                    ${theme === 'light'
                            ? 'text-neutral-700 hover:bg-teal-200'
                            : 'text-[var(--color-dark-text)] hover:bg-neutral-600 '
                        }`}>
                        <Plus className="w-5 h-5" />
                        <span>Nueva conversación</span>
                    </button>

                    <nav className="space-y-2 mb-6 pt-5 flex-1 overflow-y-auto custom-scrollbar border-t border-[var(--color-dark-border)]">
                        <h3 className={`text-sm font-semibold uppercase mb-2 pl-4 ${theme === 'light' ? 'text-[var(--color-text)]' : 'text-[var(--color-dark-text-secondary)]'}`}>Recientes</h3>
                        <a href="#" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                        ${theme === 'light'
                                ? 'hover:bg-teal-200 text-[var(--color-text-main)]'
                                : 'hover:bg-[var(--color-dark-border)] text-[var(--color-dark-text)]'
                            }`}>
                            <Search className={`w-4 h-4 ${theme === 'light' ? 'text-neutral-900' : 'text-[var(--color-dark-text-secondary)]'}`} />
                            <span className="text-sm">Hang out</span>
                        </a>
                        <a href="#" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                        ${theme === 'light'
                                ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-main)]'
                                : 'bg-[var(--color-dark-border)] text-[var(--color-dark-text)]'
                            }`}>
                            <Layers className={`w-4 h-4 ${theme === 'light' ? 'text-neutral-900' : 'text-[var(--color-dark-text-secondary)]'}`} />
                            <span className="text-sm">diferentes maneras de usar get como verbo frasal</span>
                        </a>
                        <a href="#" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                        ${theme === 'light'
                                ? 'hover:bg-teal-200 text-[var(--color-text-main)]'
                                : 'hover:bg-[var(--color-dark-border)] text-[var(--color-dark-text)]'
                            }`}>
                            <UploadCloud className={`w-4 h-4 ${theme === 'light' ? 'text-neutral-900' : 'text-[var(--color-dark-text-secondary)]'}`} />
                            <span className="text-sm">Como subir añadir palabras a la pagina por git?</span>
                        </a>
                        <button className={`w-full text-left px-3 py-2 text-sm hover:underline
                        ${theme === 'light' ? 'text-[var(--color-accent-blue)]' : 'text-[var(--color-accent-blue)]'}`}>
                            Mostrar más
                        </button>
                    </nav>

                    <div className="w-full space-y-2">
                        <a href="#" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                        ${theme === 'light'
                                ? 'hover:bg-teal-200 text-[var(--color-text-main)]'
                                : 'hover:bg-[var(--color-dark-border)] text-[var(--color-dark-text)]'
                            }`}>
                            <Settings className={`w-5 h-5 ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`} />
                            <span>Ajustes y ayuda</span>
                        </a>
                    </div>
                </div>
        </div>
    );
}

export default SidebarIA;