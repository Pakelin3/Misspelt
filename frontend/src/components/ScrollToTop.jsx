import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Al navegar entre rutas, `BrowserRouter` conserva la posicion de scroll, asi que
 * cambiar de pagina podia dejarte a media altura de la anterior.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
