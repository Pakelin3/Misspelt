import React from 'react';
import { Link } from 'react-router-dom';

const CheckEmailPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-[var(--background)]">
            <div className={`
                p-6 sm:p-8 rounded-none w-full max-w-md text-center
                border-4 border-[var(--foreground)] box-border 
                shadow-[8px_8px_0_0_hsl(var(--foreground))]
                bg-[var(--card)] relative
            `}>
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-[var(--primary)] border-4 border-[var(--foreground)] aspect-square"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[var(--accent)] border-4 border-[var(--foreground)] aspect-square"></div>

                <div className="flex justify-center mb-6">
                    <svg className="w-16 h-16 text-[var(--accent)] fill-current stroke-[var(--foreground)] stroke-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="20" height="16" rx="2" fill="hsl(var(--card))" />
                        <path d="M22 6L12 13L2 6" stroke="hsl(var(--foreground))" strokeLinecap="square" strokeLinejoin="miter" />
                    </svg>
                </div>

                <h2 className="text-2xl font-pixel text-[var(--foreground)] mb-4">
                    ¡CASI LISTO!
                </h2>

                <p className="text-[var(--muted-foreground)] text-sm sm:text-base leading-relaxed mb-6 font-sans">
                    Mágicamente enviamos un pergamino a tu <span className="font-pixel text-[var(--primary)]">buzón de correo</span>.
                    Revísalo (incluso en la carpeta de spam) para confirmar tu cuenta y comenzar a jugar.
                </p>

                <p className="font-pixel text-xs text-[var(--foreground)] opacity-70 mt-4 animate-pulse">
                    ESPERANDO VERIFICACIÓN...
                </p>

                <div className="mt-8">
                    <Link
                        to="/login"
                        className="inline-block px-4 py-2 bg-[var(--secondary)] text-[var(--foreground)] border-4 border-[var(--foreground)] font-pixel text-sm hover:bg-[var(--primary)] transition-none active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                    >
                        YA ME VERIFIQUÉ
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckEmailPage;