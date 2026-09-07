import { useEffect } from 'react';

const BASE_TITLE = 'Misspelt';

/**
 * Titula la pestaña por vista. Antes todas las rutas compartian el titulo
 * estatico del index.html, asi que el historial del navegador y las pestañas
 * abiertas eran indistinguibles entre si.
 */
const usePageTitle = (title) => {
    useEffect(() => {
        document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
        return () => {
            document.title = BASE_TITLE;
        };
    }, [title]);
};

export default usePageTitle;
