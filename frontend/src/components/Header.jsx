import React from 'react';
import { Menu } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import ThemeButton from '@/components/ThemeButton';


function Header({ toggleSidebar }) {
    const { theme } = useTheme();

    return (
        <header className={`flex items-center justify-between p-4 transition-all ease-in-out duration-300 ${theme === 'light' ? 'bg-[var(--color-bg-secondary)]' : 'bg-[var(--color-dark-bg-secondary)]'} border-b border-[#333] sticky top-0 z-20`}>
            <div className="flex items-center w-full justify-between gap-4">
                <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-full hover:bg-gray-700 md:hidden ${theme === 'light' ? 'hover:bg-gray-700' : 'hover:bg-[var(--color-dark-bg-secondary)]'}`}
                >
                    <Menu className="w-6 h-6 text-gray-400" />
                </button>
                <h1 className={`text-xl rounded-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-[var(--color-dark-text)]'}`}>Nombre conversacion</h1>
                <ThemeButton className={theme === 'light' ? 'text-gray-900' : 'text-[var(--color-dark-text)]'} />
            </div>
        </header>
    );
}

export default Header;