import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthContext from '@/context/AuthContext';
import DropdownLenguage from "@/components/DropdownLenguage";
import ThemeButton from "@/components/ThemeButton";
import { BookIcon, BrainIcon, TrophyIcon, LeafIcon, SwordIcon, GearIcon } from "@/components/PixelIcons"; // <--- Agrega GearIcon

function Navbar() {
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const mobileMenuButtonRef = useRef(null);
    const profileDropdownRef = useRef(null);

    // Lógica original de rutas activas
    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleProfileDropdown = () => setIsProfileDropdownOpen(prev => !prev);

    // Cierre al hacer click fuera
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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cerrar menú al cambiar de ruta
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileDropdownOpen(false);
    }, [location.pathname]);

    // Lógica de ocultar Navbar
    const noNavbarPaths = ['/login', '/register', '/check-email', '/verify-email/:token', '/ia-fullmode']; // Agregué ia-fullmode por si acaso
    const shouldShowNavbar = !noNavbarPaths.some(path => {
        if (path.includes(':')) {
            const regexPath = new RegExp(`^${path.replace(/:[^/]+/g, '[^/]+')}$`);
            return regexPath.test(location.pathname);
        }
        return location.pathname === path;
    });

    // Lógica de imagen de perfil
    let finalProfileImageSrc = 'https://ui-avatars.com/api/?name=User&background=random'; // Fallback más limpio
    if (user) {
        if (user.current_avatar_url) finalProfileImageSrc = user.current_avatar_url;
        else if (user.profile_image_url) finalProfileImageSrc = user.profile_image_url;
        else finalProfileImageSrc = `https://ui-avatars.com/api/?name=${user.username}&background=random`;
    }

    if (!shouldShowNavbar) return null;

    // Clases comunes para links de navegación
    const navLinkClass = (path) => `
        flex items-center gap-2 px-3 py-2 font-sans text-lg rounded-sm transition-colors
        ${isActive(path)
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-primary/20 hover:text-foreground"
        }
    `;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b-4 border-foreground bg-card shadow-sm">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

                {/* --- LOGO --- */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 group text-decoration-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary pixel-border-primary group-hover:scale-105 transition-transform">
                            <LeafIcon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="font-mono text-xs md:text-sm text-foreground tracking-tight leading-tight">
                            MISSPELT
                        </span>
                    </Link>
                </div>

                {/* --- DESKTOP NAV --- */}
                <div className="hidden md:flex items-center ml-6 gap-1">
                    {/* <Link to="/" className={navLinkClass("/")}>
                            <LeafIcon className="w-5 h-5" /> Inicio
                        </Link> */}
                    <Link to="/dictionary" className={navLinkClass("/dictionary")}>
                        <BookIcon className="w-5 h-5" /> <p className=" text-2xl" >Diccionario</p>
                    </Link>
                    <Link to="/ia" className={navLinkClass("/ia")}>
                        <BrainIcon className="w-5 h-5" /> <p className=" text-2xl" >IA</p>
                    </Link>
                    <Link to="/badges" className={navLinkClass("/badges")}>
                        <TrophyIcon className="w-5 h-5" /> <p className=" text-2xl" >Insignias</p>
                    </Link>
                    {user && user.is_staff && (
                        <Link to="/admin-dashboard" className={navLinkClass("/admin-dashboard")}>
                            <GearIcon className="w-5 h-5" /><p className=" text-2xl" >Admin</p>
                        </Link>
                    )}
                </div>

                {/* --- RIGHT SECTION (Botones + User) --- */}
                <div className="flex items-center gap-3">

                    {/* Botón JUGAR destacado */}
                    {/* <Link 
                        to="/play" 
                        className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 font-mono text-[10px] pixel-border-primary pixel-btn text-decoration-none"
                    >
                        <SwordIcon className="w-4 h-4" /> JUGAR
                    </Link> */}

                    {/* <div className="hidden md:block">
                        <ThemeButton /> 
                    </div> */}

                    {user ? (
                        /* --- USER DROPDOWN (Pixel Style) --- */
                        <div className="relative" ref={profileDropdownRef}>
                            <button
                                onClick={toggleProfileDropdown}
                                className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={finalProfileImageSrc}
                                    alt="Profile"
                                    className="w-10 h-10 pixel-border rounded-fulls bg-background object-cover"
                                />
                                <span className="hidden md:block font-mono text-xs truncate max-w-[100px]">
                                    {user.username}
                                </span>
                            </button>

                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-card pixel-border z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 border-b-2 border-muted mb-1">
                                        {/* // TODO: Mostrar aqui el nivel real del jugador y agregar apodos por recompensa(si es muy dificil se hace por nivel)  */}
                                        <p className="font-mono text-[10px] text-muted-foreground">Nivel 5 • Granjero</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setIsProfileDropdownOpen(false)}
                                        className="flex items-center px-4 py-2 font-sans text-lg hover:bg-primary hover:text-primary-foreground transition-colors rounded-sm"
                                    >
                                        Perfil
                                    </Link>

                                    {/* <div className="px-4 py-1">
                                        <DropdownLenguage /> 
                                    </div> */}

                                    <button
                                        onClick={logoutUser}
                                        className="w-full text-left flex items-center px-4 py-2 font-sans text-lg text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-sm"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* --- AUTH BUTTONS (Pixel Style) --- */
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                to="/login"
                                className="font-mono text-xs px-3 py-2 text-foreground hover:underline"
                            >
                                LOGIN
                            </Link>
                            <Link
                                to="/register"
                                className="bg-accent text-accent-foreground px-3 py-2 font-mono text-xs pixel-border-accent pixel-btn text-decoration-none"
                            >
                                REGISTRO
                            </Link>
                        </div>
                    )}

                    {/* --- MOBILE TOGGLE --- */}
                    <button
                        ref={mobileMenuButtonRef}
                        className="md:hidden p-2 flex flex-col gap-1 justify-center items-center w-10 h-10 active:scale-95 transition-transform"
                        onClick={toggleMobileMenu}
                    >
                        <span className={`block h-1 w-6 bg-foreground transition-transform ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                        <span className={`block h-1 w-6 bg-foreground transition-opacity ${isMobileMenuOpen ? "opacity-0" : ""}`} />
                        <span className={`block h-1 w-6 bg-foreground transition-transform ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                    </button>
                </div>
            </nav>

            {/* --- MOBILE MENU --- */}
            {
                isMobileMenuOpen && (
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden border-t-4 border-foreground bg-card px-4 pb-6 pt-2 animate-accordion-down"
                    >
                        <ul className="flex flex-col gap-2">
                            <Link to="/" onClick={toggleMobileMenu} className={navLinkClass("/")}>
                                <LeafIcon className="w-5 h-5" /> Inicio
                            </Link>
                            <Link to="/play" onClick={toggleMobileMenu} className={navLinkClass("/play")}>
                                <SwordIcon className="w-5 h-5" /> Jugar
                            </Link>
                            <Link to="/dictionary" onClick={toggleMobileMenu} className={navLinkClass("/dictionary")}>
                                <BookIcon className="w-5 h-5" /> Diccionario
                            </Link>
                            <Link to="/ia" onClick={toggleMobileMenu} className={navLinkClass("/ia")}>
                                <BrainIcon className="w-5 h-5" /> IA
                            </Link>
                            <Link to="/badges" onClick={toggleMobileMenu} className={navLinkClass("/badges")}>
                                <TrophyIcon className="w-5 h-5" /> Insignias
                            </Link>

                            <hr className="border-2 border-muted my-2" />

                            {user ? (
                                <>
                                    <Link to="/profile" onClick={toggleMobileMenu} className="flex items-center gap-2 px-3 py-2 font-sans text-lg">
                                        <img src={finalProfileImageSrc} className="w-6 h-6 rounded-sm pixel-border" />
                                        Mi Perfil
                                    </Link>
                                    <button
                                        onClick={() => { logoutUser(); toggleMobileMenu(); }}
                                        className="w-full text-left px-3 py-2 font-sans text-lg text-destructive"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2 mt-2">
                                    <Link to="/login" onClick={toggleMobileMenu} className="text-center font-mono text-xs border-2 border-foreground py-2">
                                        INICIAR SESIÓN
                                    </Link>
                                    <Link to="/register" onClick={toggleMobileMenu} className="text-center font-mono text-xs bg-primary text-primary-foreground py-2 pixel-border-primary">
                                        REGISTRARSE
                                    </Link>
                                </div>
                            )}
                        </ul>
                    </div>
                )
            }
        </header >
    );
}

export default Navbar;