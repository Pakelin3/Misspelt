import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import LoadingVerification from '@/components/LoadingVerification';

const EmailVerificationLandingPage = () => {
    const { token } = useParams();
    const location = useLocation();
    const { showAlert } = useContext(AuthContext) || {};
    const [verificationStatus, setVerificationStatus] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const status = urlParams.get('status');

        if (status) {
            setVerificationStatus(status);
        } else if (token) {
            console.warn("EmailVerificationLandingPage: Token en URL pero sin parámetro 'status'. Esto sugiere que la redirección del backend no ocurrió como se esperaba.");
            setVerificationStatus('backend_redirect_failed');
        } else {

            if (showAlert && typeof showAlert === 'function') {
                showAlert('Información', 'Página de verificación de correo. Si esperas un email, por favor, revisa tu bandeja de entrada.', 'info');
            }
            setTimeout(() => {
                if (showAlert && typeof showAlert === 'function') {
                    showAlert('Redirigiendo...', null, 'info', false, 1000);
                }

            }, 500);
        }
    }, [token, location.search, showAlert]);

    if (!verificationStatus && !token) {

        return (
            <div className="flex justify-center items-center min-h-screen bg-[var(--background)] p-4">
                <div className={`
                    p-6 sm:p-8 rounded-none w-full max-w-md text-center
                    border-4 border-[var(--foreground)] box-border 
                    shadow-[8px_8px_0_0_hsl(var(--destructive))]
                    bg-[var(--card)] relative
                `}>
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-[var(--destructive)] border-4 border-[var(--foreground)] aspect-square"></div>

                    <h2 className="text-2xl font-pixel text-[var(--destructive)] mb-4">
                        ERROR CRÍTICO
                    </h2>

                    <p className="text-[var(--muted-foreground)]">
                        No hay información de verificación mágica para procesar. El enlace parece estar corrompido, intenta registrarte nuevamente.
                    </p>
                </div>
            </div>
        );
    }

    return <LoadingVerification status={verificationStatus} showAlert={showAlert} />;
};

export default EmailVerificationLandingPage;