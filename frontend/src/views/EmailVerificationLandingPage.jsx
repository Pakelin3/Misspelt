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
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-bold mb-4">Acceso Inválido</h2>
                    <p className="text-gray-600">No hay información de verificación para procesar.</p>
                </div>
            </div>
        );
    }

    return <LoadingVerification status={verificationStatus} showAlert={showAlert} />;
};

export default EmailVerificationLandingPage;