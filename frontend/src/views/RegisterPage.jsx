import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import googleIcon from '@/assets/google.svg';
import { LeafIcon } from '@/components/PixelIcons';

function RegisterPage({ onScreenChange }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});

    const { registerUser } = useContext(AuthContext);
    const navigate = useNavigate();

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

    return (
        <div className="flex justify-center items-center min-h-screen bg-background p-4 font-sans">
            <div className="bg-card pixel-border p-6 sm:p-8 w-full max-w-md relative shadow-none">
                
                {/* Botón Cerrar */}
                <Link
                    to="/"
                    onClick={(e) => {
                        e.preventDefault();
                        onScreenChange ? onScreenChange('register') : navigate('/');
                    }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive font-mono text-xl transition-colors no-underline"
                > 
                    X
                </Link>

                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-primary/20 rounded-sm flex items-center justify-center pixel-border-primary">
                            <LeafIcon className="w-10 h-10 text-primary" />
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    {/* Botón Google */}
                    <button type="button" className="flex cursor-not-allowed items-center justify-center gap-3 px-4 py-3 border-2 border-foreground bg-white text-foreground font-sans text-2xl hover:bg-muted transition-colors opacity-70">
                        <img src={googleIcon} alt="Google" className="w-5 h-5 pixel-rendering" />
                        Registro con Google
                    </button>

                    <div className="flex items-center text-center text-muted-foreground my-2">
                        <span className="flex-grow border-b-2 border-muted"></span>
                        <span className="px-3 bg-card font-mono text-xs">O</span>
                        <span className="flex-grow border-b-2 border-muted"></span>
                    </div>

                    {/* Input Email */}
                    <div className="space-y-1">
                        <input
                            type="email"
                            placeholder="Correo electrónico..."
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value.toLowerCase());
                                setErrors(prev => ({ ...prev, email: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0
                                ${errors.email ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            required
                        />
                        {errors.email && <p className="text-destructive font-mono text-[10px] mt-1 tracking-tighter">* {errors.email[0]}</p>}
                    </div>

                    {/* Input Username */}
                    <div className="space-y-1">
                        <input
                            type="text"
                            placeholder="Nombre de usuario..."
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setErrors(prev => ({ ...prev, username: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0
                                ${errors.username ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            required
                        />
                        {errors.username && <p className="text-destructive font-mono text-[10px] mt-1 tracking-tighter">* {errors.username[0]}</p>}
                    </div>

                    {/* Input Password */}
                    <div className="space-y-1">
                        <input
                            type="password"
                            placeholder="Contraseña..."
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrors(prev => ({ ...prev, password: undefined, non_field_errors: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0
                                ${errors.password ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            required
                        />
                        {errors.password && <p className="text-destructive font-mono text-[10px] mt-1 tracking-tighter">* {errors.password[0]}</p>}
                    </div>

                    {/* Input Confirm Password */}
                    <div className="space-y-1">
                        <input
                            type="password"
                            placeholder="Confirmar contraseña..."
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErrors(prev => ({ ...prev, confirm_password: undefined }));
                            }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-2xl placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0
                                ${errors.confirm_password ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            required
                        />
                        {errors.confirm_password && <p className="text-destructive font-mono text-[10px] mt-1 tracking-tighter">* {errors.confirm_password[0]}</p>}
                    </div>

                    {/* Errores Generales */}
                    {(errors.non_field_errors || errors.detail || errors.general_error) && (
                        <div className="bg-destructive/10 border-2 border-destructive p-2 text-center mt-2">
                            <p className="text-destructive font-mono text-[10px] leading-tight">
                                {errors.non_field_errors?.[0] || errors.detail || errors.general_error}
                            </p>
                        </div>
                    )}

                    {/* Botón Submit */}
                    <button 
                        type="submit" 
                        className="w-full py-4 mt-4 bg-primary text-primary-foreground font-mono text-sm pixel-border-primary pixel-btn cursor-pointer uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                    >
                        Crear Cuenta
                    </button>

                    <div className="text-center text-muted-foreground text-xl font-sans mt-4">
                        ¿Ya tienes granja?
                        <Link
                            to="/login"
                            onClick={(e) => {
                                e.preventDefault();
                                onScreenChange ? onScreenChange('login') : navigate('/login');
                            }}
                            className="ml-2 text-accent hover:text-accent-foreground hover:underline decoration-2 underline-offset-4"
                        > 
                            INICIA SESIÓN
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;