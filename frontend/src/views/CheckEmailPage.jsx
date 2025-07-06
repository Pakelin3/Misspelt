import React from 'react';
import { useTheme } from '@/context/ThemeContext';

const CheckEmailPage = () => {
    const { theme } = useTheme();
    return (
        <div className="flex justify-center items-center min-h-screen p-4" style={{ backgroundColor: theme.backgroundColor }}>
            <div className={`p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-md ${theme === 'light' ? 'bg-[var(--color-bg-main)]' : 'bg-[var(--color-dark-bg-secondary)]'}`}>
                <h2 className="text-2xl text-center font-semibold text-gray-800" style={{ color: theme === 'light' ? '#333' : '#fff' }}>Verifica tu correo</h2>

                <p className="text-gray-600 text-center mt-4" style={{ color: theme === 'light' ? '#666' : '#ccc' }}>
                    Acabamos de enviar un enlace de verificación a tu correo
                    electrónico. Por favor, revisa tu bandeja de entrada (y spam).
                </p>
            </div>
        </div>
    );
};

export default CheckEmailPage;