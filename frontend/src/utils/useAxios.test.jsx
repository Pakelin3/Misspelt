import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { refreshAccessToken } from '@/utils/useAxios';

vi.mock('axios');

/**
 * El backend usa ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION, asi que un
 * refresh token sirve UNA sola vez. Antes habia dos mecanismos de refresh sin
 * coordinar (un setInterval en AuthContext y el interceptor de cada instancia de
 * useAxios, que 17 componentes crean), de modo que dos llamadas simultaneas
 * quemaban el token y cerraban la sesion de un usuario valido.
 *
 * Estos tests fijan la invariante que lo evita: por muchas llamadas concurrentes
 * que haya, solo sale UNA peticion de refresh a la red.
 */
describe('refreshAccessToken', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('hace una sola peticion de red aunque se llame en paralelo', async () => {
        let resolveUpstream;
        axios.post.mockReturnValue(
            new Promise((resolve) => {
                resolveUpstream = () => resolve({ data: { access: 'nuevo-access', refresh: 'nuevo-refresh' } });
            }),
        );

        // Diez consumidores detectan el token expirado en el mismo tick.
        const llamadas = Array.from({ length: 10 }, () => refreshAccessToken('refresh-viejo'));
        resolveUpstream();
        const resultados = await Promise.all(llamadas);

        expect(axios.post).toHaveBeenCalledTimes(1);
        // Y todos reciben el mismo par de tokens, no uno distinto cada uno.
        for (const r of resultados) {
            expect(r).toEqual({ access: 'nuevo-access', refresh: 'nuevo-refresh' });
        }
    });

    it('envia el refresh token al endpoint correcto', async () => {
        axios.post.mockResolvedValue({ data: { access: 'a', refresh: 'r' } });
        await refreshAccessToken('mi-refresh');

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/token/refresh/'),
            { refresh: 'mi-refresh' },
        );
    });

    it('permite un refresh nuevo despues de que el anterior termine', async () => {
        axios.post.mockResolvedValue({ data: { access: 'a1', refresh: 'r1' } });
        await refreshAccessToken('r0');

        axios.post.mockResolvedValue({ data: { access: 'a2', refresh: 'r2' } });
        const segundo = await refreshAccessToken('r1');

        // La promesa compartida se libera al acabar: no deja la app sin poder
        // volver a refrescar nunca mas.
        expect(axios.post).toHaveBeenCalledTimes(2);
        expect(segundo.access).toBe('a2');
    });

    it('libera la promesa compartida tambien cuando el refresh falla', async () => {
        axios.post.mockRejectedValueOnce(new Error('401'));
        await expect(refreshAccessToken('quemado')).rejects.toThrow('401');

        axios.post.mockResolvedValue({ data: { access: 'ok', refresh: 'ok' } });
        await expect(refreshAccessToken('valido')).resolves.toEqual({ access: 'ok', refresh: 'ok' });
        expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('propaga el fallo a todos los que esperaban el mismo refresh', async () => {
        const boom = new Error('refresh en blacklist');
        axios.post.mockRejectedValue(boom);

        const llamadas = Array.from({ length: 4 }, () => refreshAccessToken('quemado').catch((e) => e));
        const resultados = await Promise.all(llamadas);

        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(resultados.every((r) => r === boom)).toBe(true);
    });
});

describe('refreshAccessToken con rotacion de tokens', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('usa el refresh guardado, no el que le pasa un closure rancio', async () => {
        // Escenario real observado en el navegador: una instancia de useAxios
        // creada hace varios renders conserva en su closure el `authTokens` de
        // entonces. Con ROTATE_REFRESH_TOKENS ese token ya esta en lista negra,
        // asi que refrescar con el cerraba la sesion de un usuario valido.
        window.localStorage.setItem('authTokens', JSON.stringify({
            access: 'access-nuevo', refresh: 'refresh-vigente',
        }));
        axios.post.mockResolvedValue({ data: { access: 'a', refresh: 'r' } });

        await refreshAccessToken('refresh-rancio-del-closure');

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/token/refresh/'),
            { refresh: 'refresh-vigente' },
        );
    });

    it('cae al token del closure si no hay nada guardado', async () => {
        axios.post.mockResolvedValue({ data: { access: 'a', refresh: 'r' } });
        await refreshAccessToken('el-unico-que-tengo');
        expect(axios.post).toHaveBeenCalledWith(
            expect.anything(),
            { refresh: 'el-unico-que-tengo' },
        );
    });

    it('no se rompe si el almacen tiene basura', async () => {
        window.localStorage.setItem('authTokens', 'esto-no-es-json');
        axios.post.mockResolvedValue({ data: { access: 'a', refresh: 'r' } });
        await expect(refreshAccessToken('respaldo')).resolves.toBeTruthy();
        expect(axios.post).toHaveBeenCalledWith(expect.anything(), { refresh: 'respaldo' });
    });
});
