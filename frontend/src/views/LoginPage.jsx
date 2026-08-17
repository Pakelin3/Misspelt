import React, { useState, useContext, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import googleIcon from '@/assets/google.svg';
import { LeafIcon } from '@/components/PixelIcons';
import { Button } from '@/components/ui/Button';
import usePageTitle from '@/hooks/usePageTitle';

function LoginPage({ onScreenChange }) {
    usePageTitle('Iniciar sesión');
    const { loginUser, googleAuth } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const emailId = useId();
    const passwordId = useId();
    const emailErrorId = useId();
    const passwordErrorId = useId();
    const generalErrorId = useId();

    const emailError = errors.email?.[0] || errors.detail;
    const passwordError = errors.password?.[0];
    const generalError = errors.detail || errors.general_error;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!email.trim()) {
            setErrors(prev => ({ ...prev, email: ['El correo electrónico no puede estar vacío'] }));
            return;
        }
        if (!password.trim()) {
            setErrors(prev => ({ ...prev, password: ['La contraseña no puede estar vacía'] }));
            return;
        }

        const responseErrors = await loginUser(email, password);
        if (responseErrors && Object.keys(responseErrors).length > 0) {
            setErrors(responseErrors);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const responseErrors = await googleAuth(tokenResponse.access_token);
            if (responseErrors && Object.keys(responseErrors).length > 0) {
                setErrors(responseErrors);
            }
        },
        onError: () => {
            setErrors({ general_error: 'Fallo al conectar con Google' });
        }
    });

    return (
        <main id="main-content" className="flex justify-center items-center min-h-screen bg-background p-4 font-sans">
            {/* Contenedor Pixel Art */}
            <div className="bg-card pixel-border p-6 sm:p-8 w-full max-w-md relative shadow-none">

                {/* Botón de cerrar (X) estilo pixel */}
                <Link
                    to="/"
                    onClick={(e) => {
                        e.preventDefault();
                        onScreenChange ? onScreenChange('login') : navigate('/');
                    }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive font-mono text-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Cerrar e ir al inicio"
                >
                    X
                </Link>

                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-primary/20 rounded-sm flex items-center justify-center pixel-border-primary">
                            <LeafIcon className="w-10 h-10 text-primary" aria-hidden="true" />
                        </div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-mono text-foreground mb-2">Iniciar sesión</h2>
                    <p className="text-muted-foreground text-lg">Bienvenido de vuelta a la granja</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

                    {/* Botón Google Pixelado */}
                    <button
                        type="button"
                        onClick={() => handleGoogleLogin()}
                        // El fondo blanco y el texto negro los exige la guia de marca de
                        // Google para su boton de acceso: no son tokens del tema.
                        className="flex items-center justify-center gap-3 px-4 py-3 min-h-11 border-2 border-foreground bg-white text-black font-sans text-xl transition hover:brightness-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <img src={googleIcon} alt="" aria-hidden="true" width="20" height="20" className="w-5 h-5 pixel-rendering" />
                        CONTINUAR CON GOOGLE
                    </button>

                    <div className="flex items-center text-center text-muted-foreground my-2">
                        <span className="flex-grow border-b-2 border-muted"></span>
                        <span className="px-3 bg-card font-mono text-xs">O</span>
                        <span className="flex-grow border-b-2 border-muted"></span>
                    </div>

                    {/* Input Email */}
                    <div className="space-y-1">
                        <label htmlFor={emailId} className="sr-only">Correo electrónico o nombre de usuario</label>
                        <input
                            id={emailId}
                            type="text" // Cambiado a text para permitir username
                            inputMode="email"
                            autoComplete="username"
                            placeholder="Correo o usuario..."
                            name="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value.toLowerCase()); setErrors(prev => ({ ...prev, email: undefined, detail: undefined })); }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-xl placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${emailError ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            aria-invalid={emailError ? 'true' : undefined}
                            aria-describedby={emailError ? emailErrorId : undefined}
                            required
                        />
                        {emailError && <p id={emailErrorId} role="alert" className="text-destructive font-mono text-2xs mt-1">* {emailError}</p>}
                    </div>

                    {/* Input Password */}
                    <div className="space-y-1">
                        <label htmlFor={passwordId} className="sr-only">Contraseña</label>
                        <div className="relative">
                            <input
                                id={passwordId}
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                placeholder="Contraseña..."
                                name="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined, detail: undefined })); }}
                                className={`w-full px-4 py-3 bg-background border-2 font-sans text-xl placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10
                                    ${passwordError ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                                aria-invalid={passwordError ? 'true' : undefined}
                                aria-describedby={passwordError ? passwordErrorId : undefined}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-pressed={showPassword}
                            >
                                <span className="font-mono text-xs">{showPassword ? 'OCULTAR' : 'VER'}</span>
                            </button>
                        </div>
                        {passwordError && <p id={passwordErrorId} role="alert" className="text-destructive font-mono text-2xs mt-1">* {passwordError}</p>}
                    </div>

                    {generalError && (
                        <div id={generalErrorId} role="alert" className="bg-destructive/10 border-2 border-destructive p-2 text-center">
                            <p className="text-destructive font-mono text-2xs">{generalError}</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-lg">
                        <label className="flex items-center text-foreground cursor-pointer select-none">
                            <div className={`w-5 h-5 border-2 border-foreground mr-2 flex items-center justify-center ${rememberMe ? 'bg-primary' : 'bg-background'}`} aria-hidden="true">
                                {rememberMe && <span className="text-primary-foreground font-bold text-sm">✓</span>}
                            </div>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="sr-only"
                            />
                            Recordarme
                        </label>
                        <span className="text-muted-foreground text-sm text-right max-w-[55%]">
                            ¿Problemas para entrar? Escríbenos a soporte.
                        </span>
                    </div>

                    {/* Botón Submit Pixel Art */}
                    <Button type="submit" variant="default" size="lg" className="w-full mt-2">
                        ENTRAR A JUGAR
                    </Button>

                    <div className="text-center text-muted-foreground text-lg mt-4">
                        ¿No tienes granja?
                        <Link
                            to="/register"
                            onClick={(e) => {
                                e.preventDefault();
                                onScreenChange ? onScreenChange('register') : navigate('/register');
                            }}
                            className="ml-2 text-accent-strong hover:text-accent-foreground hover:underline decoration-2 underline-offset-4 font-bold"
                        >
                            CREAR CUENTA
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default LoginPage;
