import { createContext, useContext } from 'react';

/**
 * `theme` es el tema RESUELTO que se está pintando ('light' | 'dark').
 * `preference` es lo que eligió el usuario ('light' | 'dark' | 'system'), que no
 * es lo mismo: con 'system' el tema resuelto cambia si cambia el ajuste del SO.
 */
export const ThemeContext = createContext({
    theme: 'light',
    preference: 'system',
    setPreference: () => {},
    toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const THEME_PREFERENCES = ['light', 'dark', 'system'];
