import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScaleLoader from "react-spinners/ScaleLoader";

const LoadingVerification = ({ status, showAlert }) => {
    const navigate = useNavigate();
    const [delayFinished, setDelayFinished] = useState(false);
    const REDIRECT_DELAY_MS = 8000;

    useEffect(() => {

        const timer = setTimeout(() => {
            setDelayFinished(true);
        }, REDIRECT_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (delayFinished) {
            if (showAlert && typeof showAlert === 'function') {
                if (status === 'success') {
                    showAlert('¡Verificación Completa!', 'Tu correo ha sido verificado con éxito. Serás redirigido al login.', 'success', true, 3000)
                        .then(() => navigate('/login', { replace: true }));
                } else if (status === 'expired_or_invalid') {
                    showAlert('Enlace Inválido o Expirado', 'El enlace de verificación ha expirado o es inválido. Por favor, regístrate de nuevo.', 'error');
                    navigate('/register', { replace: true });
                } else if (status === 'token_not_found') {
                    showAlert('Error de Verificación', 'El token de verificación no fue encontrado. El enlace podría ser incorrecto o ya fue usado.', 'error');
                    navigate('/register', { replace: true });
                } else if (status === 'already_verified') {
                    showAlert('Información', 'Tu correo ya estaba verificado. Redirigiendo al login.', 'info');
                    navigate('/login', { replace: true });
                } else {
                    showAlert('Error', 'Ocurrió un error inesperado durante la verificación.', 'error');
                    navigate('/login', { replace: true });
                }
            } else {
                console.error("showAlert no está disponible en LoadingVerification.");
                navigate('/login', { replace: true });
            }
        }
    }, [delayFinished, status, showAlert, navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    Verificando tu correo electrónico...
                </h2>
                <div className="mb-8">
                    <ScaleLoader
                        visible={true}
                        height="80"
                        width="80"
                        color="#4A90E2"
                        ariaLabel="triangle-loading"
                        wrapperStyle={{}}
                        wrapperClass=""
                    />
                </div>
                <p className="text-gray-600 text-lg">
                    Por favor, espera un momento. Estamos confirmando tu cuenta.
                </p>
            </div>
        </div>
    );
};

export default LoadingVerification;