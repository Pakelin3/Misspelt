import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ScaleLoader from "react-spinners/ScaleLoader";

const STATUS_DESTINATIONS = {
    success: {
        title: '¡Verificación Completa!',
        text: 'Tu correo ha sido verificado con éxito.',
        icon: 'success',
        to: '/login',
    },
    expired_or_invalid: {
        title: 'Enlace Inválido o Expirado',
        text: 'El enlace de verificación ha expirado o es inválido. Por favor, regístrate de nuevo.',
        icon: 'error',
        to: '/register',
    },
    token_not_found: {
        title: 'Error de Verificación',
        text: 'El token de verificación no fue encontrado. El enlace podría ser incorrecto o ya fue usado.',
        icon: 'error',
        to: '/register',
    },
    already_verified: {
        title: 'Información',
        text: 'Tu correo ya estaba verificado.',
        icon: 'info',
        to: '/login',
    },
};

const LoadingVerification = ({ status, showAlert }) => {
    const navigate = useNavigate();
    // Antes eran 8s fijos sin forma de saltárselos. Se reduce a un valor que
    // sigue dando tiempo a leer el toast, y además se ofrece un enlace para
    // continuar de inmediato sin esperar.
    const REDIRECT_DELAY_MS = 2500;
    const navigatedRef = useRef(false);

    const destination = STATUS_DESTINATIONS[status] || {
        title: 'Error',
        text: 'Ocurrió un error inesperado durante la verificación.',
        icon: 'error',
        to: '/login',
    };

    const goNow = useCallback(() => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        navigate(destination.to, { replace: true });
    }, [navigate, destination.to]);

    useEffect(() => {
        navigatedRef.current = false;

        if (showAlert && typeof showAlert === 'function') {
            showAlert(destination.title, destination.text, destination.icon, 3000);
        } else {
            console.error("showAlert no está disponible en LoadingVerification.");
        }

        const timer = setTimeout(goNow, REDIRECT_DELAY_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="p-6 sm:p-8 rounded-none w-full max-w-md text-center border-4 border-foreground box-border shadow-pixel-xl-primary bg-card relative">
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-secondary border-4 border-foreground aspect-square" aria-hidden="true"></div>

                <h2 className="text-2xl font-mono text-foreground mb-6 uppercase tracking-wider">
                    Verificando...
                </h2>

                <div className="mb-8 flex justify-center" role="status" aria-live="polite">
                    <ScaleLoader
                        visible={true}
                        height={60}
                        width={10}
                        color="hsl(var(--primary))"
                        ariaLabel="Verificando correo"
                    />
                    <span className="sr-only">Verificando tu correo, por favor espera.</span>
                </div>

                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-sans mb-6">
                    Por favor, espera un momento. Estamos inspeccionando tu pergamino mágico y confirmando tu cuenta.
                </p>

                <button
                    type="button"
                    onClick={goNow}
                    className="text-accent-strong hover:text-accent-foreground hover:underline decoration-2 underline-offset-4 font-sans text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Continuar ahora
                </button>
            </div>
        </div>
    );
};

export default LoadingVerification;
