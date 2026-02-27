import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import googleIcon from '@/assets/google.svg';
import { LeafIcon } from '@/components/PixelIcons';

function LoginPage({ onScreenChange }) {
    const { loginUser } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

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

    return (
        <div className="flex justify-center items-center min-h-screen bg-background p-4 font-sans">
            {/* Contenedor Pixel Art */}
            <div className="bg-card pixel-border p-6 sm:p-8 w-full max-w-md relative shadow-none">

                {/* Botón de cerrar (X) estilo pixel */}
                <Link
                    to="/"
                    onClick={(e) => {
                        e.preventDefault();
                        onScreenChange ? onScreenChange('login') : navigate('/');
                    }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-destructive font-mono text-xl transition-colors"
                >
                    X
                </Link>

                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-primary/20 rounded-sm flex items-center justify-center pixel-border-primary">
                            <LeafIcon className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-xl md:text-2xl font-mono text-foreground mb-2">INICIAR SESIÓN</h2>
                    <p className="text-muted-foreground text-lg">Bienvenido de vuelta a la granja</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Botón Google Pixelado */}
                    <button type="button" className="flex cursor-not-allowed items-center justify-center gap-3 px-4 py-3 border-2 border-foreground bg-white text-foreground font-sans text-xl hover:bg-muted transition-colors opacity-70">
                        <img src={googleIcon} alt="Google Icon" className="w-5 h-5 pixel-rendering" />
                        CONTINUAR CON GOOGLE
                    </button>

                    <div className="flex items-center text-center text-muted-foreground my-2">
                        <span className="flex-grow border-b-2 border-muted"></span>
                        <span className="px-3 bg-card font-mono text-xs">O</span>
                        <span className="flex-grow border-b-2 border-muted"></span>
                    </div>

                    {/* Input Email */}
                    <div className="space-y-1">
                        <input
                            type="text" // Cambiado a text para permitir username
                            placeholder="Correo o usuario..."
                            name="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value.toLowerCase()); setErrors(prev => ({ ...prev, email: undefined, detail: undefined })); }}
                            className={`w-full px-4 py-3 bg-background border-2 font-sans text-xl placeholder:text-muted-foreground focus:outline-none focus:ring-0
                                ${errors.email || errors.detail ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                            required
                        />
                        {errors.email && <p className="text-destructive font-mono text-[10px] mt-1">* {errors.email[0]}</p>}
                    </div>

                    {/* Input Password */}
                    <div className="space-y-1">
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Contraseña..."
                                name="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined, detail: undefined })); }}
                                className={`w-full px-4 py-3 bg-background border-2 font-sans text-xl placeholder:text-muted-foreground focus:outline-none focus:ring-0 pr-10
                                    ${errors.password || errors.detail ? 'border-destructive text-destructive' : 'border-muted focus:border-primary text-foreground'}`}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <span className="font-mono text-xs">{showPassword ? 'OCULTAR' : 'VER'}</span>
                            </button>
                        </div>
                        {errors.password && <p className="text-destructive font-mono text-[10px] mt-1">* {errors.password[0]}</p>}
                    </div>

                    {(errors.detail || errors.general_error) && (
                        <div className="bg-destructive/10 border-2 border-destructive p-2 text-center">
                            <p className="text-destructive font-mono text-[10px]">{errors.detail || errors.general_error}</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-lg">
                        <label className="flex items-center text-foreground cursor-pointer select-none">
                            <div className={`w-5 h-5 border-2 border-foreground mr-2 flex items-center justify-center ${rememberMe ? 'bg-primary' : 'bg-background'}`}>
                                {rememberMe && <span className="text-primary-foreground font-bold text-sm">✓</span>}
                            </div>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="hidden"
                            />
                            Recordarme
                        </label>
                        <Link to="/forgot-password" className="text-accent text-lg hover:text-accent-foreground hover:underline decoration-2 underline-offset-2">
                            ¿Olvidaste la contraseña?
                        </Link>
                    </div>

                    {/* Botón Submit Pixel Art */}
                    <button
                        type="submit"
                        className="w-full py-4 mt-2 bg-primary text-primary-foreground font-mono text-sm pixel-border-primary pixel-btn cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                    >
                        ENTRAR A JUGAR
                    </button>

                    <div className="text-center text-muted-foreground text-lg mt-4">
                        ¿No tienes granja?
                        <Link
                            to="/register"
                            onClick={(e) => {
                                e.preventDefault();
                                onScreenChange ? onScreenChange('register') : navigate('/register');
                            }}
                            className="ml-2 text-accent hover:text-accent-foreground hover:underline decoration-2 underline-offset-4 font-bold"
                        >
                            CREAR CUENTA
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;