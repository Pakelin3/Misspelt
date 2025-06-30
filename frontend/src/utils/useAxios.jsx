import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useContext, useMemo } from 'react';
import AuthContext from '@/context/AuthContext';

const baseURL = import.meta.env.VITE_BACKEND_URL_API;

const useAxios = () => {
    const { authTokens, setUser, setAuthTokens, logoutUser } = useContext(AuthContext);

    const axiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL,
            headers: { Authorization: `Bearer ${authTokens?.access}` }
        });

        instance.interceptors.request.use(async (req) => {
            if (!authTokens || !authTokens.access) {
                return req;
            }

            let user;
            try {
                user = jwtDecode(authTokens.access);
            } catch (e) {
                console.error("Error decoding access token:", e);
                logoutUser();
                return Promise.reject(e);
            }

            const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

            if (!isExpired) {
                return req;
            }

            try {
                const response = await axios.post(`${baseURL}/token/refresh/`, {
                    refresh: authTokens.refresh
                });

                localStorage.setItem("authTokens", JSON.stringify(response.data));
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access));

                req.headers.Authorization = `Bearer ${response.data.access}`;
                return req;

            } catch (error) {
                console.error("Error al refrescar el token, cerrando sesión:", error.response || error);
                logoutUser();
                return Promise.reject(error);
            }
        });
        
        return instance;
    }, [authTokens, logoutUser, setAuthTokens, setUser]);

    return axiosInstance;
}

export default useAxios;