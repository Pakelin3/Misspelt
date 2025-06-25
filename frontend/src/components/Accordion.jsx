import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext'; // Importar el contexto del tema

const Accordion = () => {
    const [openPanel, setOpenPanel] = useState(null);
    const { theme } = useTheme(); // Obtener el tema actual

    const togglePanel = (panelIndex) => {
        setOpenPanel(openPanel === panelIndex ? null : panelIndex);
    };

    const panels = [
        {
            title: 'Visión del juego',
            content:
                'Convertirse en una herramienta educativa de referencia para el mundo entero bb, combinando gamificación e inteligencia artificial para hacer el aprendizaje del inglés coloquial accesible y divertido',
        },
        {
            title: 'Propósito del juego',
            content:
                'Facilitar el aprendizaje de jergas y verbos frasales a través de un videojuego interactivo con IA, adaptándose al nivel y necesidades de estudiantes de idiomas de la UNIMAR',
        },
        {
            title: '¿Quieres añadir más palabras?',
            content:
                '¡Este juego es de código abierto! Contribuye con tus propias jergas o verbos frasales para enriquecer la experiencia de aprendizaje. Puedes hacerlo a través de nuestro repositorio en GitHub o contactando con el equipo de desarrollo.',
            hasButton: true,
            buttonText: 'Ir al Repositorio en GitHub',
            buttonLink: 'https://github.com',
        },
    ];

    return (
        <div className="">
            {panels.map((panel, index) => (
                <div key={index} className="border-b border-[var(--color-bg-secondary)] last:border-b-0">
                    <button
                        className={`flex justify-between items-center cursor-pointer w-full py-4 px-5 text-left text-lg font-semibold transition-colors duration-300 focus:outline-none 
                            ${theme === 'light'
                                ? 'text-[var(--color-text-main)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-main)] focus:bg-[var(--color-bg-main)]'
                                : 'text-[var(--color-dark-text)] bg-[var(--color-dark-bg-secondary)] hover:bg-[var(--color-dark-bg-tertiary)] focus:bg-[var(--color-dark-bg-tertiary)]'
                            }`}
                        onClick={() => togglePanel(index)}
                    >
                        {panel.title}
                        <svg
                            className={`w-5 h-5 transition-transform duration-300 ${openPanel === index ? 'rotate-180' : 'rotate-0'}
                                ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${openPanel === index ? 'max-h-screen opacity-100 py-3' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className={`px-5 pb-4 ${theme === 'light' ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-dark-text-secondary)]'}`}>
                            {panel.content}
                            {panel.hasButton && panel.buttonLink && (
                                <a
                                    href={panel.buttonLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-block px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[var(--color-bg-secondary)] 
                                    hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-bg-secondary)] transition-colors duration-300"
                                >
                                    {panel.buttonText}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Accordion;