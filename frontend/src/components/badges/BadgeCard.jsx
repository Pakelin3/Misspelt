import React from 'react';
import { TrophyIcon } from '@/components/PixelIcons';

// Icono de Candado Local (Simple)
const LockIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const CheckIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const BadgeCard = ({ badge, status }) => {
    const { unlocked, progress, showProgress, conditionText } = status;

    return (
        <div className={`
            relative flex flex-col items-center p-6 transition-all duration-300
            bg-card pixel-border group
            ${unlocked ? 'hover:-translate-y-2' : 'opacity-80 grayscale hover:grayscale-0 hover:opacity-100'}
        `}>
            
            {/* --- CABECERA DE LA TARJETA (Icono/Imagen) --- */}
            <div className="relative mb-4 w-24 h-24 flex items-center justify-center">
                {/* Fondo decorativo del icono */}
                <div className={`absolute inset-0 border-4 border-dashed rounded-full ${unlocked ? 'border-primary animate-spin-slow' : 'border-muted'}`} />
                
                {/* Imagen del Badge */}
                {badge.image ? (
                    <img
                        src={badge.image}
                        alt={badge.title}
                        className={`w-16 h-16 object-contain z-10 pixel-rendering transition-transform ${unlocked ? 'scale-110' : 'scale-90'}`}
                    />
                ) : (
                    <TrophyIcon className="w-12 h-12 text-muted-foreground z-10" />
                )}

                {/* Badge de Estado (Candado o Check) */}
                <div className={`absolute -bottom-2 -right-2 p-2 pixel-border z-20 ${unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {unlocked ? <CheckIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                </div>
            </div>

            {/* --- CUERPO DE LA TARJETA --- */}
            <div className="text-center w-full flex-1 flex flex-col">
                <h3 className={`font-mono text-sm mb-2 leading-tight ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.title}
                </h3>
                
                <p className="font-sans text-lg text-muted-foreground leading-none mb-4 flex-1">
                    {conditionText}
                </p>

                {/* --- BARRA DE PROGRESO PIXELADA --- */}
                {showProgress && !unlocked && (
                    <div className="w-full mt-auto">
                        <div className="flex justify-between text-[10px] font-mono mb-1 text-muted-foreground">
                            <span>PROGRESO</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full h-4 bg-muted border-2 border-foreground relative">
                            <div 
                                className="h-full bg-accent transition-all duration-500 border-r-2 border-foreground"
                                style={{ width: `${progress}%` }}
                            />
                            {/* Líneas de brillo para efecto retro */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                        </div>
                    </div>
                )}

                {unlocked && (
                    <div className="w-full mt-auto py-1 bg-primary/20 border-2 border-primary text-primary font-mono text-[10px]">
                        ¡DESBLOQUEADO!
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeCard;