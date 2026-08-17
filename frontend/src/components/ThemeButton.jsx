import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

export default function ThemeButton() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            // `aria-pressed` para que un lector de pantalla anuncie el estado,
            // no solo la accion. El anillo de foco antes apuntaba a
            // var(--color-bg-tertiary), que no existe en ningun sitio: era invisible.
            aria-pressed={isDark}
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className="flex size-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            {isDark
                ? <Sun aria-hidden="true" className="w-5 h-5" />
                : <Moon aria-hidden="true" className="w-5 h-5" />}
        </button>
    );
}
