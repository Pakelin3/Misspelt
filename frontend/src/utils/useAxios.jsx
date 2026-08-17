import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useContext, useMemo } from 'react';
import AuthContext from '@/context/AuthContext';

const baseURL = import.meta.env.VITE_BACKEND_URL_API;

// Con ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION en el backend, un
// refresh token solo sirve una vez. Si dos llamadas concurrentes (de
// distintos componentes, o el intervalo de fondo) intentan refrescar a la
// vez, la segunda llega con un refresh ya quemado y provoca un logout de un
// usuario con sesión válida. Esta promesa vive a nivel de módulo (no de hook)
// para que TODAS las instancias de useAxios de la app, sin importar cuántos
// componentes lo usen, esperen el mismo refresh en vuelo en lugar de disparar
// uno cada una.
let refreshPromise = null;

/**
 * Refresca el token una sola vez aunque se llame concurrentemente desde
 * múltiples sitios (los interceptores de axios de cada instancia de
 * useAxios, y el intervalo de refresco en segundo plano de AuthContext).
 * Se exporta para que AuthContext.updateToken use exactamente esta misma
 * promesa compartida en lugar de disparar su propia llamada de refresh: así
 * hay un único punto de refresh en toda la app. Devuelve los datos de la
 * respuesta (access/refresh) o lanza el error si el refresh falla.
 */
export function refreshAccessToken(refreshToken) {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${baseURL}/token/refresh/`, { refresh: refreshToken })
            .then((response) => response.data)
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

const useAxios = () => {
    const { authTokens, setUser, setAuthTokens, logoutUser } = useContext(AuthContext);

    const axiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL,
            headers: { Authorization: `Bearer ${authTokens?.access}` }
        });

        const persistTokens = (data) => {
            localStorage.setItem('authTokens', JSON.stringify(data));
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            return data;
        };

        instance.interceptors.request.use(async (req) => {
            if (!authTokens || !authTokens.access) {
                return req;
            }

            let decoded;
            try {
                decoded = jwtDecode(authTokens.access);
            } catch (e) {
                console.error('Error decoding access token:', e);
                logoutUser();
                return Promise.reject(e);
            }

            const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 1;

            if (!isExpired) {
                return req;
            }

            try {
                const data = await refreshAccessToken(authTokens.refresh);
                persistTokens(data);
                req.headers.Authorization = `Bearer ${data.access}`;
                return req;
            } catch (error) {
                console.error('Error al refrescar el token (preventivo):', error.response || error);
                // No cerramos sesión aquí todavía: puede que el reloj local esté
                // desincronizado y el token en realidad siga siendo válido en el
                // servidor. Dejamos que la petición salga con el token actual y
                // que el interceptor de respuesta decida ante un 401 real.
                return req;
            }
        });

        // El interceptor de request solo mira la expiración local con dayjs: un
        // reloj de cliente desincronizado puede marcar un token como válido
        // cuando el servidor ya lo rechaza (o viceversa). Este interceptor de
        // respuesta es la fuente de verdad: solo ante un 401 real reintenta una
        // vez con un token fresco, y solo si ese reintento también falla cierra
        // la sesión.
        instance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const { response, config } = error;

                if (!response || response.status !== 401 || config?._retried || !authTokens?.refresh) {
                    return Promise.reject(error);
                }

                config._retried = true;

                try {
                    const data = await refreshAccessToken(authTokens.refresh);
                    persistTokens(data);
                    config.headers.Authorization = `Bearer ${data.access}`;
                    return instance(config);
                } catch (refreshError) {
                    console.error('Error al refrescar el token tras 401, cerrando sesión:', refreshError.response || refreshError);
                    logoutUser();
                    return Promise.reject(refreshError);
                }
            }
        );

        return instance;
    }, [authTokens, logoutUser, setAuthTokens, setUser]);

    return axiosInstance;
}

export default useAxios;
