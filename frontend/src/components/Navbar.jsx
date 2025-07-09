import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import DropdownLenguage from "@/components/DropdownLenguage";

function Navbar() {
    const { user, logoutUser } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const mobileMenuButtonRef = useRef(null);
    const profileDropdownRef = useRef(null);

    const isActive = (path) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
                mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const noNavbarPaths = ['/login', '/register', '/check-email', '/verify-email/:token', '/ia'];
    const shouldShowNavbar = !noNavbarPaths.some(path => {
        if (path.includes(':')) {
            const regexPath = new RegExp(`^${path.replace(/:[^/]+/g, '[^/]+')}$`);
            return regexPath.test(location.pathname);
        }
        return location.pathname === path;
    });

    let finalProfileImageSrc = '';
    if (user) {
        if (user.current_avatar_url) {
            finalProfileImageSrc = user.current_avatar_url;
        } else if (user.profile_image_url) {
            finalProfileImageSrc = user.profile_image_url;
        }
    }
    if (!finalProfileImageSrc) {
        finalProfileImageSrc = 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fstackoverflow.com%2Fquestions%2F38576264%2Fhow-can-i-programmatically-check-if-a-google-users-profile-picture-isnt-defaul&psig=AOvVaw1TrWin8HXRPftPqI2iPWv5&ust=1751834937122000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCOjs_urLpo4DFQAAAAAdAAAAABAE';
    }
    if (!shouldShowNavbar) {
        return null;
    }

    return (
        <nav className="bg-[var(--color-bg-secondary)] p-3 shadow-md z-50 sticky top-0">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-6 md:gap-8">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="h-10 px-2 flex items-center justify-center bg-[var(--color-white)] rounded-full"> NombreGame</div>

                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`
                                text-[var(--color-white)]
                                text-lg
                                whitespace-pre
                                font-medium
                                pb-0.5
                                transition-colors duration-150 ease-in-out
                                ${isActive("/")
                                    ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                    : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                }
                            `}
                        >🏠 Inicio</Link>
                        <Link
                            to="/play"
                            className={`
                                text-[var(--color-white)]
                                pb-0.5
                                whitespace-pre
                                transition-colors duration-150 ease-in-out
                                ${isActive("/play")
                                    ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                    : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                }
                            `}>🎮 Jugar</Link>
                        <Link
                            to="/dictionary"
                            className={`
                                text-[var(--color-white)]
                                pb-0.5
                                whitespace-pre
                                transition-colors duration-150 ease-in-out
                                ${isActive("/dictionary")
                                    ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                    : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                }
                            `}>📚 Diccionario</Link>
                        <Link
                            to="/ia"
                            className={`
                                text-[var(--color-white)]
                                pb-0.5
                                whitespace-pre
                                transition-colors duration-150 ease-in-out
                                ${isActive("/ia")
                                    ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                    : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                }
                            `}>🤖 IA</Link>
                        <Link
                            to="/badges"
                            className={`
                                text-[var(--color-white)]
                                pb-0.5
                                whitespace-pre
                                transition-colors duration-150 ease-in-out
                                ${isActive("/badges")
                                    ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                    : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                }
                            `}>🏆 Insignias</Link>
                        {user && user.is_staff && (
                            <Link
                                to="/admin-dashboard"
                                className={`
                                text-[var(--color-white)]
                                pb-0.5
                                whitespace-pre
                                transition-colors duration-150 ease-in-out
                                ${isActive("/admin-dashboard")
                                        ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                        : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                    }
                            `}>⚙️ Admin Panel</Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4 ml-auto">
                    <button
                        onClick={toggleTheme}
                        className="px-3 py-1 rounded-md hover:bg-black/10 focus:outline-none cursor-pointer focus:ring-2 focus:ring-[var(--color-bg-tertiary)] flex items-center gap-1"
                        aria-label="Cambiar tema"
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                        ) : (
                            <Sun className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                        )}
                    </button>

                    {user ? (
                        <div ref={profileDropdownRef} className="hidden md:flex items-center gap-2 md:gap-1">
                            <img
                                src={finalProfileImageSrc}
                                className="w-10 h-10 rounded-full object-cover ml-1"
                            />
                            <button
                                onClick={toggleProfileDropdown}
                                className="text-[var(--color-white)] px-3 py-1 rounded-md hover:bg-black/10 focus:outline-none
                                focus:ring-2 focus:ring-[var(--color-bg-tertiary)] flex items-center gap-1 cursor-pointer">
                                {user.username}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`ml-1 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`}
                                >
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            </button>
                            {isProfileDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 bg-[var(--color-white)] rounded-md shadow-lg min-w-[160px] z-10 py-2">
                                    <Link
                                        to="/profile"
                                        onClick={toggleProfileDropdown}
                                        className="px-4 py-2 font-bold text-md text-gray-600 hover:bg-gray-100 cursor-pointer flex items-center gap-2 whitespace-nowrap"
                                    >
                                        Perfil
                                    </Link>
                                    <DropdownLenguage />
                                    <div className="flex items-center justify-center mt-6 gap-2">
                                        <button
                                            className="bg-[var(--color-bg-tertiary)] text-[var(--color-white)] px-4 py-2 rounded-full 
                                            hover:bg-[var(--color-bg-tertiary-hover)] transition-colors duration-150 text-sm whitespace-nowrap"
                                            onClick={logoutUser}
                                        >
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div className="hidden md:flex items-center gap-3 md:gap-4">
                            <Link
                                to="/login"
                                className="bg-[var(--color-bg-tertiary)] text-[var(--color-white)] px-4 py-2 rounded-full hover:bg-[var(--color-bg-tertiary-hover)] transition-colors duration-150 text-sm whitespace-nowrap"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                to="/register"
                                className="border border-[var(--color-white)] text-[var(--color-white)] px-4 py-2 rounded-full hover:bg-[var(--color-white)] hover:text-[var(--color-teal-400)] transition-colors duration-150 text-sm whitespace-nowrap"
                            >
                                Registrarse
                            </Link>
                        </div>
                    )}

                    <button
                        className="md:hidden flex text-[var(--color-white)] focus:outline-none"
                        onClick={toggleMobileMenu}
                        aria-label="Abrir menú"
                        ref={mobileMenuButtonRef}
                    >
                        {isMobileMenuOpen ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16m-7 6h7"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Menú móvil desplegable */}
            <div
                ref={mobileMenuRef}
                className={`
                    md:hidden
                    absolute top-[64px] left-0 w-full bg-[var(--color-teal-400)] shadow-lg pb-4 z-40
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="flex flex-col items-center gap-4 py-2 ">
                    <Link
                        to="/"
                        onClick={toggleMobileMenu}
                        className={`text-[var(--color-white)] py-2 ${isActive("/")
                            ? "border-b-2 border-[var(--color-bg-tertiary)]"
                            : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                            }`}
                    >
                        🏠 Inicio
                    </Link>

                    <Link
                        to="/play"
                        onClick={toggleMobileMenu}
                        className={`text-[var(--color-white)] py-2 ${isActive("/play")
                            ? "border-b-2 border-[var(--color-bg-tertiary)]"
                            : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                            }`}
                    >
                        🎮 Jugar
                    </Link>
                    <Link
                        to="/dictionary"
                        onClick={toggleMobileMenu}
                        className={`text-[var(--color-white)] py-2 ${isActive("/dictionary")
                            ? "border-b-2 border-[var(--color-bg-tertiary)]"
                            : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                            }`}
                    >
                        📚 Diccionario
                    </Link>
                    <Link
                        to="/ia"
                        onClick={toggleMobileMenu}
                        className={`text-[var(--color-white)] py-2 ${isActive("/ia")
                            ? "border-b-2 border-[var(--color-bg-tertiary)]"
                            : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                            }`}
                    >
                        🤖 IA
                    </Link>
                    <Link
                        to="/badges"
                        onClick={toggleMobileMenu}
                        className={`text-[var(--color-white)] py-2 ${isActive("/badges")
                            ? "border-b-2 border-[var(--color-bg-tertiary)]"
                            : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                            }`}
                    >
                        🏆 Insignias
                    </Link>
                    {user && user.is_staff && (
                        <Link
                            to="/admin-dashboard"
                            onClick={toggleMobileMenu}
                            className={`text-[var(--color-white)] py-2 ${isActive("/admin-dashboard")
                                ? "border-b-2 border-[var(--color-bg-tertiary)]"
                                : "border-b-2 border-transparent hover:border-[var(--color-bg-tertiary)]"
                                }`}
                        >
                            ⚙️ Admin Panel
                        </Link>
                    )}
                    <hr className="w-1/2 border-[var(--color-white)] border-opacity-30 my-2" />
                    {user ? (
                        <>
                            <Link
                                to={"/profile"}
                                onClick={toggleMobileMenu}
                                className="text-[var(--color-white)] py-2 font-medium flex items-center gap-2"
                            >
                                <img
                                    src={finalProfileImageSrc}
                                    className="w-10 h-10 rounded-full object-cover ml-1"
                                />
                                {user.username}
                            </Link>
                            <button
                                className="bg-[var(--color-bg-tertiary)] text-[var(--color-white)] px-6 py-2 rounded-full hover:bg-[var(--color-bg-tertiary-hover)] transition-colors duration-150 text-base"
                                onClick={() => {
                                    logoutUser();
                                    toggleMobileMenu();
                                }}
                            >
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                onClick={toggleMobileMenu}
                                className="bg-[var(--color-bg-tertiary)] text-[var(--color-white)] px-6 py-2 rounded-full hover:bg-[var(--color-bg-tertiary-hover)] transition-colors duration-150 text-base"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                to="/register"
                                className="border border-[var(--color-white)] text-[var(--color-white)] px-6 py-2 rounded-full hover:bg-[var(--color-white)] hover:text-[var(--color-teal-400)] transition-colors duration-150 text-base"
                            >
                                Registrarse
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;