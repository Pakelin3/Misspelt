import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import googleIcon from '../assets/google.svg';


function RegisterPage({ onScreenChange }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});

    const { registerUser } = React.useContext(AuthContext);
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
        <div className="flex justify-center items-center min-h-screen bg-[var(--color-teal-400)] p-4">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md relative">
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
                    className="absolute top-4 right-4 text-gray-400 text-2xl hover:text-gray-600 transition-colors"
                > &times;
                </Link>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-teal-400 rounded-full mx-auto mb-4"></div>
                    <h2 className="text-2xl font-semibold text-gray-800">Crea una cuenta</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        <img src={googleIcon} alt="Google Icon" className="w-5 h-5" />
                        Continuar con Google
                    </button>

                    <div className="flex items-center text-center text-gray-400 my-4">
                        <span className="flex-grow border-b border-gray-200"></span>
                        <span className="px-3 bg-white">También puedes</span>
                        <span className="flex-grow border-b border-gray-200"></span>
                    </div>

                    <p className="text-sm text-gray-600 text-center mb-4">
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
                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
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
                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
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
                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
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
                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 ${errors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                        required
                    />
                    {errors.confirm_password && <label className="text-red-500 text-sm mt-1 ml-1">{errors.confirm_password[0]}</label>}
                    {errors.non_field_errors && (
                        <p className="text-red-500 text-sm text-center font-medium mt-2">{errors.non_field_errors[0]}</p>
                    )}
                    {errors.detail && <p className="text-red-500 text-sm text-center font-medium mt-2">{errors.detail}</p>}
                    {errors.general_error && <p className="text-red-500 text-sm text-center font-medium mt-2">{errors.general_error}</p>}
                    <button type="submit" className="w-full py-3 bg-[var(--color-pink-500)] text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors mt-4">
                        Crear cuenta
                    </button>

                    <p className="text-center text-gray-600 text-sm mt-4">
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
                            className="ml-1 text-blue-600 hover:underline"
                        > Inicia sesión
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;