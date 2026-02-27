import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ScaleLoader from "react-spinners/ScaleLoader";
import { toast } from "sonner";


const baseURL = import.meta.env.VITE_BACKEND_URL_API;

const AuthContext = createContext();

export default AuthContext;

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

    const showAlert = useCallback(async (title, text, icon, showConfirmButton = true, timer = null) => {
        const toastFn = icon === 'error' ? toast.error :
            icon === 'success' ? toast.success :
                icon === 'warning' ? toast.warning :
                    icon === 'info' ? toast.info : toast;
        toastFn(title, {
            description: text,
            duration: timer || 4000,
        });
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

    const loginUser = async (email, password) => {
        try {
            const response = await axios.post(`${baseURL}/token/`, {
                email,
                password,
            });

            if (response.status === 200) {
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access));
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                navigate('/');
                showToast("Inicio de sesión exitoso", "success");
                console.log("Usuario decodificado después del login:", jwtDecode(response.data.access));
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
                    showAlert('Error al iniciar sesión', translatedErrors.detail[0], 'error');
                } else if (translatedErrors.non_field_errors && translatedErrors.non_field_errors.length > 0) {
                    showAlert('Error al iniciar sesión', translatedErrors.non_field_errors[0], 'error');
                } else {
                    showAlert('Error al iniciar sesión', 'Correo electrónico o contraseña incorrectos.', 'error');
                }
                return translatedErrors;
            } else {
                showAlert('Error de Red', 'No se pudo conectar con el servidor.', 'error');
            }
        }
        return { general_error: 'Hubo un error inesperado.' };
    };

    const registerUser = async (email, username, password, confirmPassword) => {

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
                    console.log("Errores de campo manejados por el componente, no se muestra alerta general.");
                } else {
                    showAlert('Error en el Registro', 'Hubo un problema con tu registro.', 'error');
                }

                return translatedErrors;
            } else {
                showAlert('Error de Red', 'No se pudo conectar con el servidor.', 'error');
            }
        }
        return { general_error: 'Hubo un error inesperado.' };
    };

    const logoutUser = useCallback(async () => {
        try {
            await axios.post(`${baseURL}/logout/`, {}, {
                headers: {
                    Authorization: `Bearer ${authTokens?.access}`
                }
            });
            console.log("User marked offline in backend.");
        } catch (error) {
            console.error("Error marking user offline on logout:", error.response?.data || error.message);
        } finally {
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem("authTokens");
            navigate("/login");
            showToast("Has sido desconectado", "success");
        }
    }, [navigate, showToast, authTokens, setAuthTokens, setUser]);

    const updateToken = useCallback(async () => {
        if (!authTokens || !authTokens.refresh) {
            console.log("No refresh token available, logging out.");
            logoutUser();
            return;
        }

        try {
            const response = await axios.post(`${baseURL}/token/refresh/`, {
                refresh: authTokens.refresh,
            });

            if (response.status === 200) {
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access));
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                console.log("Token refreshed successfully!");
            } else {
                console.error("Failed to refresh token:", response.data);
                logoutUser();
            }
        } catch (error) {
            console.error("Error during token refresh:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.detail || error.response?.data?.code || "Error desconocido al refrescar el token.";
            showAlert("Error de Sesión", translateError(errorMessage, "Su sesión ha caducado. Por favor, inicie sesión de nuevo."), "error");
            logoutUser();
        }
    }, [authTokens, logoutUser, showAlert, translateError, setUser]);

    const verifyToken = useCallback(async () => {
        // ! console.log("verifyToken called");
        if (!authTokens) {
            setLoading(false);
            return;
        }

        try {
            const decodedToken = jwtDecode(authTokens.access);
            const currentTime = Date.now() / 1000;

            if (decodedToken.exp < currentTime) {
                console.log("Token de acceso expirado localmente, intentando refrescar...");
                await updateToken();
            } else {
                setUser(decodedToken);
            }
        } catch (error) {
            console.error("Error al decodificar o verificar token localmente:", error);
            setAuthTokens(null);
            setUser(null);
            localStorage.removeItem("authTokens");
            showAlert("Sesión Expirada", "Su sesión ha caducado. Por favor, inicie sesión de nuevo.", "info");
        } finally {
            setLoading(false);
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        }
    }, [authTokens, updateToken, setUser, showAlert]);


    const contextData = {
        user,
        setUser,
        authTokens,
        setAuthTokens,
        registerUser,
        loginUser,
        logoutUser,
        updateToken,
        baseURL
    };

    useEffect(() => {
        const LOADING_TIMEOUT_MS = 5000;

        if (loading) {
            verifyToken();
            loadingTimeoutRef.current = setTimeout(() => {
                if (loading) {
                    console.warn("carga de verificación de sesión excedió el tiempo límite.");
                    showAlert(
                        "Problema de Carga",
                        "No pudimos verificar su sesión a tiempo. Por favor, intente iniciar sesión de nuevo.",
                        "warning"
                    ).then(() => {
                        logoutUser();
                    });
                }
            }, LOADING_TIMEOUT_MS);
        } else {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        }

        const FOUR_MINUTES = 1000 * 60 * 4;
        let interval = null;

        if (authTokens) {
            interval = setInterval(() => {
                updateToken();
            }, FOUR_MINUTES);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        };
    }, [authTokens, loading, updateToken, verifyToken, user, logoutUser, showAlert]);

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