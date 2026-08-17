import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

const CheckEmailPage = () => {
    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-background">
            <div className="p-6 sm:p-8 rounded-none w-full max-w-md text-center border-4 border-foreground box-border shadow-pixel-xl bg-card relative">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary border-4 border-foreground aspect-square" aria-hidden="true"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-accent border-4 border-foreground aspect-square" aria-hidden="true"></div>

                <div className="flex justify-center mb-6">
                    <svg className="w-16 h-16 text-accent fill-current stroke-foreground stroke-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="2" y="4" width="20" height="16" rx="2" fill="hsl(var(--card))" />
                        <path d="M22 6L12 13L2 6" stroke="hsl(var(--foreground))" strokeLinecap="square" strokeLinejoin="miter" />
                    </svg>
                </div>

                <h2 className="text-2xl font-mono text-foreground mb-4">
                    ¡CASI LISTO!
                </h2>

                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 font-sans">
                    Mágicamente enviamos un pergamino a tu <span className="font-mono text-primary">buzón de correo</span>.
                    Abre el enlace que contiene para confirmar tu cuenta y comenzar a jugar.
                </p>

                <p className="font-mono text-xs text-foreground opacity-70 mt-4">
                    ESPERANDO VERIFICACIÓN...
                </p>

                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mt-6 font-sans">
                    ¿No te llegó? Revisa la carpeta de spam. Si tras unos minutos sigue sin aparecer,
                    regístrate de nuevo con el mismo correo para recibir un nuevo enlace.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                    <Button asChild variant="secondary" size="lg" className="w-full">
                        <Link to="/login">
                            IR AL INICIO DE SESIÓN
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to="/register">
                            NO ME LLEGÓ, REGISTRARME DE NUEVO
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CheckEmailPage;
