import React, { useEffect, useRef, useState } from 'react';
import veFlagSrc from '@/assets/ve.svg';
import usaFlagSrc from '@/assets/us.svg';

function DropdownLenguage() {

    const [selectedLanguage, setSelectedLanguage] = useState({ name: 'Español', flag: veFlagSrc });
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const handleLanguageDropdownClick = () => {
        setIsLanguageDropdownOpen(prev => !prev);
    };
    const handleLanguageSelect = (languageName, flagSrc) => {
        setSelectedLanguage({ name: languageName, flag: flagSrc });
        setIsLanguageDropdownOpen(false);
        // ! `LanguageContext` similar a `AuthContext`.
        console.log(`Idioma seleccionado: ${languageName}`);
    };

    const languageDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
                setIsLanguageDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className=" font-bold text-md text-gray-600 hover:bg-gray-100 cursor-pointer flex items-center justify-between whitespace-nowrap" ref={languageDropdownRef}>
            <button
                onClick={handleLanguageDropdownClick}
                className="px-4 py-2 flex items-center w-full cursor-pointer "
            >
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
                    className={`transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-90' : 'rotate-270'}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
                {selectedLanguage.name} <img src={selectedLanguage.flag} alt={`Bandera de ${selectedLanguage.name}`} className="w-6 h-auto ml-2" />
            </button>
            {isLanguageDropdownOpen && (
                <div className="absolute right-full mt-2 mr-2 bg-[var(--color-white)] rounded-md shadow-lg min-w-[160px] z-10 py-2">
                    <div
                        onClick={() => handleLanguageSelect('Español', veFlagSrc)}
                        className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                        Español <img src={veFlagSrc} alt="Bandera de Venezuela" className="w-6 h-auto" />
                    </div>
                    <div
                        onClick={() => handleLanguageSelect('English', usaFlagSrc)}
                        className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    >
                        English <img src={usaFlagSrc} alt="Bandera de Estados Unidos" className="w-6 h-auto" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default DropdownLenguage; 