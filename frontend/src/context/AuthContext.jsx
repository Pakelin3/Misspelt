import { createContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ScaleLoader from "react-spinners/ScaleLoader";
import { toast } from "sonner";
import { refreshAccessToken } from "@/utils/useAxios";


const baseURL = import.meta.env.VITE_BACKEND_URL_API;

const AuthContext = createContext();

export default AuthContext;

// Mensaje único para cualquier ruta de código que descubra que la sesión ya
// no es válida (token corrupto, refresh fallido, timeout de verificación).
// Antes había tres textos distintos según qué código detectara el problema;
// ahora todos dicen lo mismo: qué pasó y qué puede hacer el usuario.
const SESSION_EXPIRED_TITLE = "Sesión finalizada";
const SESSION_EXPIRED_MESSAGE = "Tu sesión caducó o no pudo verificarse. Inicia sesión de nuevo para continuar.";

export const AuthProvider = ({ children }) => {

    const [authTokens, setAuthTokens] = useState(() =>
        localStorage.getItem("authTokens")
            ? JSON.parse(localStorage.getItem("authTokens"))
            : null
    );

    const [user, setUser] = useState(() =>
        localStorage.getItem("authTokens")
            ? jwtDecode(JSON.parse(localStorage.getItem("authTokens")).access)
            : null
    );

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadingTimeoutRef = useRef(null);

    const showAlert = useCallback(async (title, text, icon = true, timer = null) => {
        const toastFn = icon === 'error' ? toast.error :
            icon === 'success' ? toast.success :
                icon === 'warning' ? toast.warning :
                    icon === 'info' ? toast.info : toast;

        const options = { duration: timer || 4000 };
        if (text) options.description = text;

        toastFn(title, options);
    }, []);

    const showToast = useCallback(async (title, icon = 'success', timer = 4000) => {
        const toastFn = icon === 'error' ? toast.error :
            icon === 'success' ? toast.success :
                icon === 'warning' ? toast.warning :
                    icon === 'info' ? toast.info : toast;
        toastFn(title, {
            duration: timer,
        });
    }, []);

    const translateError = useCallback((errorKey, defaultMessage = '') => {
        const translations = {
            "user with this email already exists.": "Ya existe un usuario con este correo electrónico.",
            "A user with that username already exists.": "Ya existe un usuario con ese nombre de usuario.",
            "This field may not be blank.": "Este campo no puede estar vacío.",
            "Enter a valid email address.": "Introduce una dirección de correo electrónico válida.",
            "String representation of a datetime with timezone information.": "Formato de fecha y hora inválido.",
            "This password is too short. It must contain at least 8 characters.": "La contraseña es demasiado corta. Debe contener al menos 8 caracteres.",
            "The password fields didn't match.": "Las contraseñas no coinciden.",
            "This field is required.": "Este campo es obligatorio.",
            "Invalid credentials": "Credenciales inválidas",
            "Email or password is incorrect.": "Correo electrónico o contraseña incorrectos.",
            "please fill out this field": "Por favor, completa este campo.",
            "Given token not valid for any token type": "Token inválido o expirado. Por favor, inicia sesión de nuevo.",
            "token_not_valid": "El token de acceso no es válido o ha expirado.",

        };
        return translations[errorKey] || defaultMessage || errorKey;
    }, []);

    const loginUser = useCallback(async (email, password) => {
        try {
            const response = await axios.post(`${baseURL}/token/`, {
                email,
                password,
            });

            if (response.status === 200) {
                const decodedUser = jwtDecode(response.data.access);
                setAuthTokens(response.data);
                setUser(decodedUser);
                localStorage.setItem('authTokens', JSON.stringify(response.data));

                if (!decodedUser.verified) {
                    navigate('/check-email');
                    showAlert("Falta poco", "Por favor, verifica tu correo electrónico para usar tu cuenta.", "info");
                } else {
                    // Aterrizar en una vista útil según el rol, no en la landing
                    // de marketing: un usuario normal va al diccionario, un
                    // staff a su panel de administración.
                    navigate(decodedUser.is_staff ? '/admin-dashboard' : '/dictionary');
                    showToast("Inicio de sesión exitoso", "success");
                }

                return {};
            }
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error.response?.data || error.message);
            if (error.response && (error.response.status === 401 || error.response.status === 400)) {
                const backendErrors = error.response.data;
                const translatedErrors = {};
                for (const key in backendErrors) {
                    if (Array.isArray(backendErrors[key])) {
                        translatedErrors[key] = backendErrors[key].map(msg => translateError(msg, msg));
                    } else if (typeof backendErrors[key] === 'string') {
                        translatedErrors[key] = [translateError(backendErrors[key], backendErrors[key])];
                    }
                }
                if (translatedErrors.detail && translatedErrors.detail.length > 0) {
                    showAlert('Error al iniciar sesión', '', 'error');
                } else if (translatedErrors.non_field_errors && translatedErrors.non_field_errors.length > 0) {
                    showAlert('Error al iniciar sesión', '', 'error');
                } else {
                    showAlert('Error al iniciar sesión', 'Correo electrónico o contraseña incorrectos.', 'error');
                }
                return translatedErrors;
            } else {
                showAlert('Error de Red', 'No se pudo conectar con el servidor.', 'error');
            }
        }
        return { general_error: 'Hubo un error inesperado.' };
    }, [navigate, showAlert, showToast, translateError]);

    const registerUser = useCallback(async (email, username, password, confirmPassword) => {

        try {
            const response = await axios.post(`${baseURL}/register/`, {
                email,
                username,
                password,
                confirm_password: confirmPassword,
            });

            if (response.status === 201) {
                showAlert('Registro Exitoso', 'Por favor, verifica tu correo electrónico para activar tu cuenta.', 'success', true, 5000);
                navigate('/check-email');
                return {};
            }
        } catch (error) {
            console.error('Error durante el registro:', error.response?.data || error.message);
            if (error.response && error.response.status === 400) {
                const backendErrors = error.response.data;
                const translatedErrors = {};
                for (const key in backendErrors) {
                    if (Array.isArray(backendErrors[key])) {
                        translatedErrors[key] = backendErrors[key].map(msg => translateError(msg, msg));
                    } else if (typeof backendErrors[key] === 'string') {
                        translatedErrors[key] = [translateError(backendErrors[key], backendErrors[key])];
                    }
                }

                if (translatedErrors.non_field_errors && translatedErrors.non_field_errors.length > 0) {
                    showAlert('Error en el Registro', translatedErrors.non_field_errors.join(' '), 'error');
                } else if (translatedErrors.detail && translatedErrors.detail.length > 0) {
                    showAlert('Error en el Registro', translatedErrors.detail[0], 'error');
                } else if (Object.keys(translatedErrors).length > 0) {
                    // Errores de campo: el propio formulario los muestra junto a
                    // cada input, no hace falta un toast general además.
                } else {
                    showAlert('Error en el Registro', 'Hubo un problema con tu registro.', 'error');
                }

                return translatedErrors;
            } else {
                showAlert('Error de Red', 'No se pudo conectar con el servidor.', 'error');
            }
        }
        return { general_error: 'Hubo un error inesperado.' };
    }, [navigate, showAlert, translateError]);

    const googleAuth = useCallback(async (token) => {
        try {
            const response = await axios.post(`${baseURL}/auth/google/`, {
                token: token,
            });

            if (response.status === 200 || response.status === 201) {
                const decodedUser = jwtDecode(response.data.access);
                setAuthTokens(response.data);
                setUser(decodedUser);
                localStorage.setItem('authTokens', JSON.stringify(response.data));

                navigate(decodedUser.is_staff ? '/admin-dashboard' : '/dictionary');
                showToast("Autenticación con Google exitosa", "success");
                return {};
            }
        } catch (error) {
            console.error('Error durante autenticación con Google:', error.response?.data || error.message);
            showAlert('Error con Google', 'No se pudo iniciar sesión con Google.', 'error');
            return { general_error: 'No se pudo iniciar sesión con Google.' };
        }
        return { general_error: 'Hubo un error inesperado con Google.' };
    }, [navigate, showAlert, showToast]);

    const logoutUser = useCallback(async () => {
        try {
            await axios.post(`${baseURL}/logout/`, {}, {
                headers: {
                    Authorization: `Bearer ${authTokens?.access}`
                }
            });
        } catch (error) {
            console.error("Error marking user offline on logout:", error.response?.data || error.message);
        } finally {
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem("authTokens");
            navigate("/login");
            showToast("Has sido desconectado", "success");
        }
    }, [navigate, showToast, authTokens]);

    const updateToken = useCallback(async () => {
        if (!authTokens || !authTokens.refresh) {
            logoutUser();
            return;
        }

        try {
            // Usa el mismo punto de refresh (promesa compartida a nivel de
            // módulo) que los interceptores de useAxios, para que un refresh en
            // curso disparado desde cualquier componente y este intervalo de
            // fondo nunca compitan por el mismo refresh token de un solo uso.
            const data = await refreshAccessToken(authTokens.refresh);
            setAuthTokens(data);
            setUser(jwtDecode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
        } catch (error) {
            console.error("Error during token refresh:", error.response?.data || error.message);
            showAlert(SESSION_EXPIRED_TITLE, SESSION_EXPIRED_MESSAGE, "error");
            logoutUser();
        }
    }, [authTokens, logoutUser, showAlert]);

    const verifyToken = useCallback(async () => {
        if (!authTokens) {
            setLoading(false);
            return;
        }

        try {
            const decodedToken = jwtDecode(authTokens.access);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                await updateToken();
            } else {
                setUser(decodedToken);
            }
        } catch (error) {
            console.error("Error al decodificar o verificar token localmente:", error);
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem("authTokens");
            showAlert(SESSION_EXPIRED_TITLE, SESSION_EXPIRED_MESSAGE, "info");
        } finally {
            setLoading(false);
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        }
    }, [authTokens, updateToken, showAlert]);

    // Efecto de arranque: solo se ocupa de verificar la sesión guardada al
    // cargar la app y de no dejar al usuario colgado en la pantalla de carga
    // si la verificación no responde a tiempo.
    useEffect(() => {
        const LOADING_TIMEOUT_MS = 5000;

        if (!loading) {
            return undefined;
        }

        verifyToken();
        loadingTimeoutRef.current = setTimeout(() => {
            console.warn("carga de verificación de sesión excedió el tiempo límite.");
            showAlert(
                "Problema de Carga",
                "No pudimos verificar su sesión a tiempo. Por favor, intente iniciar sesión de nuevo.",
                "warning"
            ).then(() => {
                logoutUser();
            });
        }, LOADING_TIMEOUT_MS);

        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    // Efecto de refresco periódico: separado del efecto de arranque para que
    // no se destruya y reconstruya en cada cambio de authTokens/user/etc.
    // Solo le importa si hay sesión o no.
    const hasSession = !!authTokens;
    useEffect(() => {
        if (!hasSession) {
            return undefined;
        }

        const FOUR_MINUTES = 1000 * 60 * 4;
        const interval = setInterval(() => {
            updateToken();
        }, FOUR_MINUTES);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasSession]);

    const contextData = useMemo(() => ({
        user,
        setUser,
        authTokens,
        setAuthTokens,
        registerUser,
        loginUser,
        googleAuth,
        logoutUser,
        updateToken,
        showAlert,
        showToast,
        baseURL
    }), [user, authTokens, registerUser, loginUser, googleAuth, logoutUser, updateToken, showAlert, showToast]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: 'rgb(0, 0, 0)',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: 9999
            }}>
                <ScaleLoader color="#00adb5" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};
