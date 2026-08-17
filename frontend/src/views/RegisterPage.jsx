import React, { useState, useContext, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import googleIcon from '@/assets/google.svg';
import { LeafIcon } from '@/components/PixelIcons';
import { Button } from '@/components/ui/Button';
import usePageTitle from '@/hooks/usePageTitle';

function RegisterPage({ onScreenChange }) {
    usePageTitle('Crear cuenta');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});

    const { registerUser, googleAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    const emailId = useId();
    const usernameId = useId();
    const passwordId = useId();
    const confirmPasswordId = useId();
    const emailErrorId = useId();
    const usernameErrorId = useId();
    const passwordErrorId = useId();
    const confirmPasswordErrorId = useId();

    const emailError = errors.email?.[0];
    const usernameError = errors.username?.[0];
    const passwordError = errors.password?.[0];
    const confirmPasswordError = errors.confirm_password?.[0];
    const generalError = errors.non_field_errors?.[0] || errors.detail || errors.general_error;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validación rápida en el cliente
        if (password !== confirmPassword) {
            setErrors({ confirm_password: ["Las contraseñas no coinciden"] });
            return;
        }

        const responseErrors = await registerUser(email, username, password, confirmPassword);

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
            <div className="bg-card pixel-border p-6 sm:p-8 w-full max-w-md relative shadow-none">

                {/* Botón Cerrar */}
                <Link
                    to="/"
                    onClick={(e) => {
                        e.preventDefault();
                        onScreenChange ? onScreenChange('register') : navigate('/');
                    }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive font-mono text-xl transition-colors no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Cerrar e ir al inicio"
                >
                    X
                </Link>

                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-primary/20 rounded-sm flex items-center justify-center pixel-border-primary">
                            <LeafIcon className="w-10 h-10 text-primary" aria-hidden="true" />
                        </div>
                    </div>
                    {/* Título en Arcade */}
                    <h2 className="text-xl md:text-2xl font-mono text-foreground mb-2 uppercase leading-tight">
                        Nueva Partida
                    </h2>
                    {/* Subtítulo en VT323 */}
                    <p className="text-muted-foreground text-2xl font-sans">
                        Crea tu perfil de granjero
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

                    {/* Botón Google */}
                    <button
                        type="button"
                        onClick={() => handleGoogleLogin()}
                        // El fondo blanco y el texto negro los exige la guia de marca de
                        // Google para su boton de acceso: no son tokens del tema.
                        className="flex items-center justify-center gap-3 px-4 py-3 min-h-11 border-2 border-foreground bg-white text-black font-sans text-2xl transition hover:brightness-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <img src={googleIcon} alt="" aria-hidden="true" width="20" height="20" className="w-5 h-5 pixel-rendering" />
                        Registro con Google
                    </button>

                    <div className="flex items-center text-center text-muted-foreground my-2">
                        <span className="flex-grow border-b-2 border-muted"></span>
                        <span className="px-3 bg-card font-mono text-xs">O</span>
                        <span className="flex-grow border-b-2 border-muted"></span>
                    </div>

                    {/* Input Email */}
                    <div className="space-y-1">
                        <label htmlFor={emailId} className="sr-only">Correo electrónico</label>
                        <input
                            id={emailId}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="Correo electrónico..."
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value.toLowerCase());
                                setErrors(prev => ({ ...prev, email: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${emailError ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            aria-invalid={emailError ? 'true' : undefined}
                            aria-describedby={emailError ? emailErrorId : undefined}
                            required
                        />
                        {emailError && <p id={emailErrorId} role="alert" className="text-destructive font-mono text-2xs mt-1 tracking-tighter">* {emailError}</p>}
                    </div>

                    {/* Input Username */}
                    <div className="space-y-1">
                        <label htmlFor={usernameId} className="sr-only">Nombre de usuario</label>
                        <input
                            id={usernameId}
                            type="text"
                            autoComplete="username"
                            placeholder="Nombre de usuario..."
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setErrors(prev => ({ ...prev, username: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${usernameError ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            aria-invalid={usernameError ? 'true' : undefined}
                            aria-describedby={usernameError ? usernameErrorId : undefined}
                            required
                        />
                        {usernameError && <p id={usernameErrorId} role="alert" className="text-destructive font-mono text-2xs mt-1 tracking-tighter">* {usernameError}</p>}
                    </div>

                    {/* Input Password */}
                    <div className="space-y-1">
                        <label htmlFor={passwordId} className="sr-only">Contraseña</label>
                        <input
                            id={passwordId}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Contraseña..."
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: undefined, non_field_errors: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${passwordError ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            aria-invalid={passwordError ? 'true' : undefined}
                            aria-describedby={passwordError ? passwordErrorId : undefined}
                            required
                        />
                        {passwordError && <p id={passwordErrorId} role="alert" className="text-destructive font-mono text-2xs mt-1 tracking-tighter">* {passwordError}</p>}
                    </div>

                    {/* Input Confirm Password */}
                    <div className="space-y-1">
                        <label htmlFor={confirmPasswordId} className="sr-only">Confirmar contraseña</label>
                        <input
                            id={confirmPasswordId}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirmar contraseña..."
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErrors(prev => ({ ...prev, confirm_password: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${confirmPasswordError ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            aria-invalid={confirmPasswordError ? 'true' : undefined}
                            aria-describedby={confirmPasswordError ? confirmPasswordErrorId : undefined}
                            required
                        />
                        {confirmPasswordError && <p id={confirmPasswordErrorId} role="alert" className="text-destructive font-mono text-2xs mt-1 tracking-tighter">* {confirmPasswordError}</p>}
                    </div>

                    {/* Errores Generales */}
                    {generalError && (
                        <div role="alert" className="bg-destructive/10 border-2 border-destructive p-2 text-center mt-2">
                            <p className="text-destructive font-mono text-2xs leading-tight">
                                {generalError}
                            </p>
                        </div>
                    )}

                    {/* Botón Submit */}
                    <Button type="submit" variant="default" size="lg" className="w-full mt-4">
                        Crear Cuenta
                    </Button>

                    <div className="text-center text-muted-foreground text-xl font-sans mt-4">
                        ¿Ya tienes granja?
                        <Link
                            to="/login"
                            onClick={(e) => {
                                e.preventDefault();
                                onScreenChange ? onScreenChange('login') : navigate('/login');
                            }}
                            className="ml-2 text-accent-strong hover:text-accent-foreground hover:underline decoration-2 underline-offset-4"
                        >
                            INICIA SESIÓN
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default RegisterPage;
