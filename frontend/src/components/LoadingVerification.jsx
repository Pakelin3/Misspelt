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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--background)]">
            <div className={`
                p-6 sm:p-8 rounded-none w-full max-w-md text-center
                border-4 border-[var(--foreground)] box-border 
                shadow-[8px_8px_0_0_hsl(var(--primary))]
                bg-[var(--card)] relative
            `}>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[var(--secondary)] border-4 border-[var(--foreground)] aspect-square"></div>

                <h2 className="text-2xl font-pixel text-[var(--foreground)] mb-6 uppercase tracking-wider">
                    Verificando...
                </h2>

                <div className="mb-8 flex justify-center">
                    <ScaleLoader
                        visible={true}
                        height={60}
                        width={10}
                        color="hsl(var(--primary))"
                        ariaLabel="scale-loading"
                    />
                </div>

                <p className="text-[var(--muted-foreground)] text-sm sm:text-base leading-relaxed font-sans">
                    Por favor, espera un momento. Estamos inspeccionando tu pergamino mágico y confirmando tu cuenta.
                </p>
            </div>
        </div>
    );
};

export default LoadingVerification;