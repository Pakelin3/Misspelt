import { useEffect, useState } from 'react';

/**
 * El motor Godot pesa ~82 MB entre `index.wasm` y `index.pck`, y antes empezaba
 * a descargarse solo al entrar en PLAYING: el jugador veia un rectangulo negro
 * sin ninguna señal de progreso.
 *
 * Este hook descarga los dos archivos con `fetch` mientras el usuario esta en la
 * pantalla de seleccion (donde ya esta gastando tiempo eligiendo personaje), de
 * modo que cuando pulse jugar la cache del navegador ya los tenga, y expone el
 * progreso real para poder mostrarlo.
 */
const GAME_ASSETS = [
    { url: '/game/index.wasm', weight: 0.44 },
    { url: '/game/index.pck', weight: 0.56 },
];

const useGamePreload = (enabled = true) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'

    useEffect(() => {
        if (!enabled) return;

        const controller = new AbortController();
        const loaded = GAME_ASSETS.map(() => 0);
        let cancelled = false;

        const report = () => {
            if (cancelled) return;
            const total = GAME_ASSETS.reduce((sum, asset, i) => sum + asset.weight * loaded[i], 0);
            setProgress(Math.min(100, Math.round(total * 100)));
        };

        const fetchAsset = async (asset, index) => {
            const response = await fetch(asset.url, { signal: controller.signal });
            if (!response.ok) throw new Error(`${asset.url} respondio ${response.status}`);

            const declared = Number(response.headers.get('content-length')) || 0;
            if (!response.body || !declared) {
                // Sin cuerpo legible o sin tamaño declarado no hay progreso fino:
                // se consume de golpe y se marca el tramo como completo.
                await response.arrayBuffer();
                loaded[index] = 1;
                report();
                return;
            }

            const reader = response.body.getReader();
            let received = 0;
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                received += value.length;
                loaded[index] = Math.min(1, received / declared);
                report();
            }
            loaded[index] = 1;
            report();
        };

        setStatus('loading');
        Promise.all(GAME_ASSETS.map(fetchAsset))
            .then(() => {
                if (!cancelled) {
                    setProgress(100);
                    setStatus('ready');
                }
            })
            .catch((error) => {
                if (cancelled || error.name === 'AbortError') return;
                // Que falle la precarga no debe impedir jugar: el iframe volvera a
                // pedir los archivos por su cuenta.
                setStatus('error');
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [enabled]);

    return { progress, status };
};

export default useGamePreload;
