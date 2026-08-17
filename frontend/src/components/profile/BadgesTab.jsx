import React from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon } from '@/components/PixelIcons';
import { getBadgeCategoryConfig } from '@/lib/badges';

// Vitrina de insignias desbloqueadas. Deliberadamente no duplica la lógica de
// progreso/catálogo completo de BadgesPage: aquí solo se listan las
// desbloqueadas y se enlaza a /badges para ver el catálogo entero y el
// progreso "x/y" de cada una.
const BadgesTab = ({ badges }) => (
    <div className="animate-in fade-in duration-300 space-y-4">
        <div className="flex justify-end">
            <Link
                to="/badges"
                className="text-2xs font-mono uppercase tracking-wider text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-none"
            >
                Ver catálogo completo y progreso →
            </Link>
        </div>

        {(!badges || badges.length === 0) ? (
            <div className="text-center p-12 bg-card pixel-border text-muted-foreground">
                <TrophyIcon className="w-10 h-10 mb-3 mx-auto text-muted-foreground/50" aria-hidden="true" />
                <p className="font-mono text-sm">Aún no has desbloqueado insignias.</p>
                <p className="text-xs mt-1">¡Sigue jugando para ganar tus primeras insignias!</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {badges.map(badge => {
                    const categoryConfig = getBadgeCategoryConfig(badge.category);
                    return (
                        <div key={badge.id} className="bg-card pixel-border p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform">
                            <div className="w-16 h-16 mb-3 flex items-center justify-center">
                                {badge.image ? (
                                    <img src={badge.image} alt={badge.title} loading="lazy" width={64} height={64} className="w-full h-full object-contain" />
                                ) : (
                                    <TrophyIcon className="w-10 h-10 text-accent/80" aria-hidden="true" />
                                )}
                            </div>
                            <h4 className="font-mono text-2xs font-bold text-foreground leading-tight mb-1">{badge.title}</h4>
                            <div className={`mt-2 px-2 py-0.5 text-3xs font-mono font-bold uppercase border ${categoryConfig.borderClass} ${categoryConfig.textClass} ${categoryConfig.bgClass}`}>
                                {categoryConfig.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

export default BadgesTab;
