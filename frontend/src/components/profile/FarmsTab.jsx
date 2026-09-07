import React from 'react';
import { PixelUsersIcon } from '@/components/PixelIcons';

const FarmsTab = ({ farmsLoading, farmsError, userFarms, onRetry }) => {
    if (farmsLoading) {
        return (
            <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 gap-3 animate-in fade-in duration-300">
                <div aria-hidden="true" className="w-10 h-10 border-4 border-accent-strong border-t-transparent motion-safe:animate-spin rounded-full" />
                <p className="font-mono text-xs text-muted-foreground animate-pulse">CARGANDO GRANJAS...</p>
            </div>
        );
    }

    if (farmsError) {
        return (
            <div role="alert" className="text-center p-12 bg-card pixel-border text-destructive border-4 border-destructive/50 animate-in fade-in duration-300">
                <p className="font-mono text-sm font-bold">{farmsError}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors pixel-border"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (userFarms.length === 0) {
        return (
            <div className="text-center p-12 bg-card pixel-border text-muted-foreground border-4 border-foreground animate-in fade-in duration-300">
                <span className="text-4xl mb-3 mx-auto block" aria-hidden="true">🚜</span>
                <p className="font-mono text-sm">Aún no perteneces a ninguna granja.</p>
                <p className="text-xs mt-1">¡Utiliza el cuadro superior para unirte a una con un código de acceso!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {userFarms.map(farm => (
                <div key={farm.id} className="bg-card pixel-border p-5 border-4 border-foreground hover:-translate-y-1 transition-transform shadow-pixel-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-mono font-bold text-xl tracking-wider leading-tight mb-2 truncate" title={farm.name}>{farm.name}</h3>
                                <p className="font-mono text-xs text-muted-foreground mb-1 ">Dueño: <span className="text-foreground font-bold">{farm.owner_username}</span></p>
                        </div>
                        <span className="text-3xl" aria-hidden="true" title="Granja de Estudiante"></span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="text-2xs font-mono bg-muted/50 px-2 py-1 border border-foreground/20 text-muted-foreground uppercase flex items-center gap-1">
                            <PixelUsersIcon className="w-4 h-4 text-primary" aria-hidden="true" /> {farm.students_count} Granjeros
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FarmsTab;
