import React from 'react';

const CheckEmailPage = () => {

    return (
        <div className="flex justify-center items-center min-h-screen bg-[var(--color-teal-400)] p-4">
            <div className='bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md '>
                <h2 className="text-2xl text-center font-semibold text-gray-800">Verifica tu correo</h2>

                <p className="text-gray-600 text-center mt-4">
                    Acabamos de enviar un enlace de verificación a tu correo
                    electrónico. Por favor, revisa tu bandeja de entrada (y spam).
                </p>
            </div>
        </div>
    );
};

export default CheckEmailPage;