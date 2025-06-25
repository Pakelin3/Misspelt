import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '@/context/AuthContext';
import googleIcon from '@/assets/google.svg';
import { useTheme } from '@/context/ThemeContext';

function RegisterPage({ onScreenChange }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});

    const { registerUser } = React.useContext(AuthContext);
    const { theme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const responseErrors = await registerUser(email, username, password, confirmPassword);

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
                            onScreenChange('register');
                        } else {
                            navigate('/');
                        }
                    }}
                    className="absolute top-4 right-4 text-[var(--color-text-secondary)] text-2xl hover:text-[var(--color-text)] transition-colors"
                > &times;
                </Link>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-[var(--color-bg-secondary)]  rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">Crea una cuenta</h2>
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

                    <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
                        Introduce tu correo electrónico para crear una cuenta
                    </p>
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors(prev => ({ ...prev, email: undefined }));
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                            ${theme === 'light' ? 'text-[var(--color-text)] border-[var(--color-text-secondary)] focus:ring-[var(--color-bg-secondary)]' :
                            'text-[var(--color-dark-text)] border-[var(--color-dark-border)] focus:ring-[var(--color-bg-secondary)]'} 
                            ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    />
                    {errors.email && <label className="text-red-500 text-sm mt-1 ml-1">{errors.email[0]}</label>}

                    <input
                        type="text"
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setErrors(prev => ({ ...prev, username: undefined }));
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                            ${theme === 'light' ? 'text-[var(--color-text)] border-[var(--color-text-secondary)] focus:ring-[var(--color-bg-secondary)]' :
                            'text-[var(--color-dark-text)] border-[var(--color-dark-border)] focus:ring-[var(--color-bg-secondary)]'} 
                            ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    />
                    {errors.username && <label className="text-red-500 text-sm mt-1 ml-1">{errors.username[0]}</label>}

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors(prev => ({ ...prev, password: undefined, non_field_errors: undefined }));
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                            ${theme === 'light' ? 'text-[var(--color-text)] border-[var(--color-text-secondary)] focus:ring-[var(--color-bg-secondary)]' :
                            'text-[var(--color-dark-text)] border-[var(--color-dark-border)] focus:ring-[var(--color-bg-secondary)]'}
                            ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    />
                    {errors.password && <label className="text-red-500 text-sm mt-1 ml-1">{errors.password[0]}</label>}

                    <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setErrors(prev => ({ ...prev, confirm_password: undefined }));
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                            ${theme === 'light' ? 'text-[var(--color-text)] border-[var(--color-text-secondary)] focus:ring-[var(--color-bg-secondary)]' :
                            'text-[var(--color-dark-text)] border-[var(--color-dark-border)] focus:ring-[var(--color-bg-secondary)]'}
                            ${errors.confirm_password ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    />
                    {errors.confirm_password && <label className="text-red-500 text-sm mt-1 ml-1">{errors.confirm_password[0]}</label>}

                    {(errors.non_field_errors || errors.detail || errors.general_error) && (
                        <p className="text-red-500 text-sm text-center font-medium mt-2">{errors.non_field_errors?.[0] || errors.detail || errors.general_error}</p>
                    )}
                    <button type="submit" className="w-full cursor-pointer py-3 bg-[var(--color-bg-tertiary)] text-white
                    rounded-lg font-semibold hover:bg-[var(--color-bg-tertiary-hover)] transition-colors mt-4">
                        Crear cuenta
                    </button>

                    <p className="text-center text-[var(--color-text-secondary)] text-sm mt-4">
                        ¿Ya tienes una cuenta?
                        <Link
                            to="/login"
                            onClick={(e) => {
                                e.preventDefault();
                                if (onScreenChange) {
                                    onScreenChange('login');
                                } else {
                                    navigate('/login');
                                }
                            }}
                            className="ml-1 text-[var(--color-accent-blue)] hover:underline"
                        > Inicia sesión
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;