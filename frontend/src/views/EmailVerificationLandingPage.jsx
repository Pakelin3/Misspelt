import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import LoadingVerification from '@/components/LoadingVerification';
import { Button } from '@/components/ui/Button';

const EmailVerificationLandingPage = () => {
    const { token } = useParams();
    const location = useLocation();
    const { showAlert } = useContext(AuthContext) || {};
    const [verificationStatus, setVerificationStatus] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const status = urlParams.get('status');

        let nextStatus = null;
        if (status) {
            nextStatus = status;
        } else if (token) {
            console.warn("EmailVerificationLandingPage: Token en URL pero sin parámetro 'status'. Esto sugiere que la redirección del backend no ocurrió como se esperaba.");
            nextStatus = 'backend_redirect_failed';
        }

        if (nextStatus) {
            setVerificationStatus(nextStatus);
        } else if (showAlert && typeof showAlert === 'function') {
            showAlert('Información', 'Página de verificación de correo. Si esperas un email, por favor, revisa tu bandeja de entrada.', 'info');
        }
    }, [token, location.search, showAlert]);

    if (!verificationStatus && !token) {

        return (
            <div className="flex justify-center items-center min-h-screen bg-background p-4">
                <div className="p-6 sm:p-8 rounded-none w-full max-w-md text-center border-4 border-foreground box-border shadow-pixel-xl-destructive bg-card relative">
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-destructive border-4 border-foreground aspect-square" aria-hidden="true"></div>

                    <h2 className="text-2xl font-mono text-destructive mb-4">
                        ERROR CRÍTICO
                    </h2>

                    <p className="text-muted-foreground mb-6">
                        No hay información de verificación mágica para procesar. El enlace parece estar corrompido o incompleto.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button asChild variant="secondary" size="lg" className="w-full">
                            <Link to="/register">REGISTRARME DE NUEVO</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="w-full">
                            <Link to="/login">IR AL INICIO DE SESIÓN</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="w-full">
                            <Link to="/">VOLVER AL INICIO</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return <LoadingVerification status={verificationStatus} showAlert={showAlert} />;
};

export default EmailVerificationLandingPage;