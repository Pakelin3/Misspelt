import { useEffect, useState } from 'react';

/**
 * Distingue un dispositivo con puntero fino (raton/trackpad) de uno solo tactil.
 *
 * El juego se controla con teclado y raton y no tiene mandos tactiles, asi que en
 * un movil se cargaban 82 MB para dejar al jugador con un personaje que no puede
 * moverse. Con esto se puede avisar antes de empezar la descarga.
 */
const query = '(pointer: fine)';

const usePointerCapabilities = () => {
    const [hasFinePointer, setHasFinePointer] = useState(
        () => (typeof window === 'undefined' ? true : window.matchMedia(query).matches),
    );

    useEffect(() => {
        const media = window.matchMedia(query);
        const onChange = (event) => setHasFinePointer(event.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    return {
        hasFinePointer,
        // Un portatil con pantalla tactil tiene ambos: solo es "solo tactil"
        // cuando no hay ningun puntero fino disponible.
        isTouchOnly: !hasFinePointer,
    };
};

export default usePointerCapabilities;
