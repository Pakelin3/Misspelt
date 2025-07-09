import { useTheme } from '@/context/ThemeContext';

import { Moon, Sun } from 'lucide-react';

export default function ThemeButton() {
    const { theme, toggleTheme } = useTheme();
    return (
    <button
                        onClick={toggleTheme}
                        className="px-3 py-1 rounded-md hover:bg-black/10 focus:outline-none cursor-pointer focus:ring-2 focus:ring-[var(--color-bg-tertiary)] flex items-center gap-1"
                        aria-label="Cambiar tema"
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5 text-gray-600" />
                        ) : (
                            <Sun className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
    );
}