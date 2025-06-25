import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import googleIcon from '@/assets/google.svg';
import { useTheme } from '@/context/ThemeContext'; 

function LoginPage({ onScreenChange }) {
    const { loginUser } = useContext(AuthContext);
    const { theme } = useTheme(); 
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
        <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.16))] bg-[var(--color-body-bg)] p-4">
            <div className="bg-[var(--color-bg-card)] p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <Link
                    to="/"
                    onClick={(e) => {
                        e.preventDefault();
                        if (onScreenChange) {
                            onScreenChange('login');
                        } else {
                            navigate('/');
                        }
                    }}
                    className="absolute top-4 right-4 text-[var(--color-text-secondary)] text-2xl hover:text-[var(--color-text)] transition-colors"
                > &times;
                </Link>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-[var(--color-bg-secondary)] rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">Iniciar sesión</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <button type="button" className="flex cursor-not-allowed items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition-colors
                        border-[var(--color-text-secondary)] text-[var(--color-text-main)] hover:bg-[var(--color-bg-main)] hover:text-[var(--color-text-secondary)] 
                        dark:hover:bg-[var(--color-dark-bg-tertiary)] dark:border-[var(--color-dark-border)]">
                        <img src={googleIcon} alt="Google Icon" className="w-5 h-5" />
                        Continuar con Google
                    </button>

                    <div className="flex items-center text-center text-[var(--color-text-secondary)] my-4">
                        <span className="flex-grow border-b border-[var(--color-text-secondary)] dark:border-[var(--color-dark-border)]"></span>
                        <span className="px-3 bg-[var(--color-bg-card)]">También puedes</span>
                        <span className="flex-grow border-b border-[var(--color-text-secondary)] dark:border-[var(--color-dark-border)]"></span>
                    </div>

                    <input
                        type="email"
                        placeholder="Correo electrónico o nombre de usuario"
                        name="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined, detail: undefined })); }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                            ${theme === 'light' ? 'text-[var(--color-text)] border-[var(--color-text-secondary)] focus:ring-[var(--color-bg-secondary)]' :
                                'text-[var(--color-dark-text)] border-[var(--color-dark-border)] focus:ring-[var(--color-bg-secondary)]'}
                            ${errors.email || errors.detail ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    />
                    {errors.email && <label className="text-red-500 text-sm mt-1 ml-1">{errors.email[0]}</label>}

                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            name="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined, detail: undefined })); }}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                                ${theme === 'light' ? 'text-[var(--color-text)] border-[var(--color-text-secondary)] focus:ring-[var(--color-bg-secondary)]' :
                                    'text-[var(--color-dark-text)] border-[var(--color-dark-border)] focus:ring-[var(--color-bg-secondary)]'}
                                ${errors.password || errors.detail ? 'border-red-500 focus:ring-red-500' : ''}`}
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text)]" 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '🙈' : '👁'}
                        </button>
                    </div>
                    {errors.password && <label className="text-red-500 text-sm mt-1 ml-1">{errors.password[0]}</label>}

                    {(errors.detail || errors.general_error) && (
                        <p className="text-red-500 text-sm text-center font-medium mt-2">{errors.detail || errors.general_error}</p>
                    )}

                    <div className="flex justify-between items-center text-sm mt-2">
                        <label className="flex items-center text-[var(--color-text-main)] cursor-pointer"> 
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mr-2 h-4 w-4 text-[var(--color-bg-secondary)] rounded focus:ring-[var(--color-bg-secondary)] border-[var(--color-text-secondary)]" 
                            />
                            Recordarme
                        </label>
                        <Link to="/forgot-password" className="text-[var(--color-bg-main)] hover:underline">¿Olvidó su contraseña?</Link> 
                    </div>

                    
                    <button type="submit" className="w-full cursor-pointer py-3 bg-[var(--color-bg-tertiary)] text-white rounded-lg font-semibold hover:bg-[var(--color-bg-tertiary-hover)] transition-colors mt-4"> 
                        Iniciar sesión
                    </button>

                    
                    <p className="text-center text-[var(--color-text-secondary)] text-sm mt-4"> 
                        ¿No tienes una cuenta?
                        <Link
                            to="/register"
                            onClick={(e) => {
                                e.preventDefault();
                                if (onScreenChange) {
                                    onScreenChange('register');
                                } else {
                                    navigate('/register');
                                }
                            }}
                            className="ml-1 text-[var(--color-accent-blue)] hover:underline"
                        > Crear cuenta
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;