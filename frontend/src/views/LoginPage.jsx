import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';


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
            setErrors(prev => ({ ...prev, email: ['El correo electrónico no puede estar vacío.'] }));
            return;
        }
        if (!password.trim()) {
            setErrors(prev => ({ ...prev, password: ['La contraseña no puede estar vacía.'] }));
            return;
        }

        const responseErrors = await loginUser(email, password);
        if (responseErrors && Object.keys(responseErrors).length > 0) {
            setErrors(responseErrors);
        }
        // console.log('Intentando iniciar sesión con:', { email, password }); // Removed for security: do not log passwords
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[var(--color-teal-400)] p-4">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md relative">
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
                    className="absolute top-4 right-4 text-gray-400 text-2xl hover:text-gray-600 transition-colors"
                > &times;
                </Link>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-teal-400 rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-semibold text-gray-800">Iniciar sesión</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        <span className="text-xl font-bold text-blue-500">G</span>
                        Continuar con Google
                    </button>

                    <div className="flex items-center text-center text-gray-400 my-4">
                        <span className="flex-grow border-b border-gray-200"></span>
                        <span className="px-3 bg-white">También puedes</span>
                        <span className="flex-grow border-b border-gray-200"></span>
                    </div>

                    <input
                        type="email"
                        placeholder="Correo electrónico o nombre de usuario"
                        name="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined, detail: undefined })); }}
                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.email || errors.detail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
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
                            className={`w-full px-4 py-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.password || errors.detail ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
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
                        <label className="flex items-center text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mr-2 h-4 w-4 text-teal-400 rounded focus:ring-teal-400 border-gray-300"
                            />
                            Recordarme
                        </label>
                        <Link to="/forgot-password" className="text-blue-600 hover:underline">¿Olvidó su contraseña?</Link>
                    </div>

                    <button type="submit" className="w-full py-3 bg-[var(--color-pink-500)] text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors mt-4">
                        Iniciar sesión
                    </button>

                    <p className="text-center text-gray-600 text-sm mt-4">
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
                            className="ml-1 text-blue-600 hover:underline"
                        > Crear cuenta
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;