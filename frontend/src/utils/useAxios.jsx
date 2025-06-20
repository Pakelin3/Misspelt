import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
// ! cookie-parser no se usa en este proyecto, se utiliza localStorage para almacenar los tokens de autenticación

const baseURL = "http://127.0.0.1:8000/api";

const useAxios = () => {
    const { authTokens, setUser, setAuthTokens, logoutUser } = useContext(AuthContext);

    const axiosInstance = axios.create({
        baseURL,
        headers: { Authorization: `Bearer ${authTokens?.access}` }
    });

    axiosInstance.interceptors.request.use(async (req) => {
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

    return axiosInstance;
}

export default useAxios;