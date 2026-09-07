import { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeContext } from '@/context/theme-context';

const STORAGE_KEY = 'theme';
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

/**
 * Acceso tolerante a `localStorage`.
 *
 * En navegacion privada, con cookies bloqueadas o dentro de un iframe con
 * restricciones, leer `localStorage` lanza una excepcion. Sin esta proteccion la
 * app entera se cae al montar el proveedor de tema, que es de lo primero que se
 * ejecuta. El script anti-parpadeo de index.html ya lo contempla; esto lo iguala.
 */
const almacen = {
    leer() {
        try {
            return window.localStorage?.getItem(STORAGE_KEY) ?? null;
        } catch {
            return null;
        }
    },
    escribir(valor) {
        try {
            window.localStorage?.setItem(STORAGE_KEY, valor);
        } catch { /* sin persistencia: el tema dura lo que la sesion */ }
    },
    borrar() {
        try {
            window.localStorage?.removeItem(STORAGE_KEY);
        } catch { /* idem */ }
    },
};

const leerPreferencia = () => {
    if (typeof window === 'undefined') return 'system';
    const guardada = almacen.leer();
    return guardada === 'dark' || guardada === 'light' ? guardada : 'system';
};

const temaDelSistema = () =>
    (typeof window !== 'undefined' && window.matchMedia(CONSULTA_OSCURO).matches ? 'dark' : 'light');

export const ThemeProvider = ({ children }) => {
    const [preference, setPreferenceState] = useState(leerPreferencia);
    const [temaSistema, setTemaSistema] = useState(temaDelSistema);

    // El tema que realmente se pinta: la preferencia, o el del SO si es 'system'.
    const theme = preference === 'system' ? temaSistema : preference;

    useEffect(() => {
        const media = window.matchMedia(CONSULTA_OSCURO);
        const onChange = (event) => setTemaSistema(event.matches ? 'dark' : 'light');
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.classList.toggle('light', theme !== 'dark');
        // `color-scheme` hace que el navegador pinte las barras de scroll y los
        // controles nativos acordes al tema.
        root.style.colorScheme = theme;
    }, [theme]);

    const setPreference = useCallback((valor) => {
        setPreferenceState(valor);
        if (valor === 'system') {
            // Borrar la clave es lo que reactiva el seguimiento al SO, y es lo que
            // lee el script anti-parpadeo de index.html en la siguiente carga.
            almacen.borrar();
        } else {
            almacen.escribir(valor);
        }
    }, []);

    // Alterna entre claro y oscuro de forma explicita, saliendo de 'system'.
    const toggleTheme = useCallback(() => {
        setPreference(theme === 'dark' ? 'light' : 'dark');
    }, [setPreference, theme]);

    const contextValue = useMemo(
        () => ({ theme, preference, setPreference, toggleTheme }),
        [theme, preference, setPreference, toggleTheme],
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};
