import React from 'react';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AdminPagination from './AdminPagination';

/**
 * Grid de tarjetas de insignias, extraído de BadgesAdminPanel para que el
 * panel quepa bajo el límite de líneas. Puramente presentacional: toda la
 * lógica de datos y de apertura de diálogos vive en el panel.
 */
export default function BadgeGrid({ badges, loading, onEdit, onDeleteRequest, currentPage, totalPages, onPageChange }) {
    return (
        <div className="bg-card border-4 border-foreground p-4 min-h-[400px] relative">
            {loading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-raised flex items-center justify-center" role="status" aria-live="polite">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                    <span className="sr-only">Cargando insignias...</span>
                </div>
            )}

            {badges.length === 0 && !loading ? (
                <div className="text-center p-12 text-muted-foreground italic border-2 border-dashed border-foreground/30 m-4">
                    No hay insignias configuradas. ¡Crea la primera!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {badges.map((badge) => {
                        let xpDisplay = 0;
                        if (badge.reward_data && badge.reward_data.exp) xpDisplay = badge.reward_data.exp;

                        let conditionDisplay = "N/A";
                        if (badge.unlock_condition_data && badge.unlock_condition_data.length > 0) {
                            const c = badge.unlock_condition_data[0];
                            conditionDisplay = `${c.type}: ${c.value}`;
                        }

                        return (
                            <div key={badge.id} className="group relative bg-muted/20 border-2 border-foreground p-4 flex flex-col items-center text-center hover:bg-muted/40 transition-colors">
                                <div className="w-24 h-24 mb-4 bg-background border-2 border-foreground p-2 relative overflow-hidden flex items-center justify-center">
                                    {badge.image ? (
                                        <img src={badge.image} alt={badge.title} width={96} height={96} loading="lazy" className="w-full h-full object-contain pixelated" />
                                    ) : (
                                        <div className="text-muted-foreground text-2xs">NO IMAGE</div>
                                    )}
                                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-2xs px-1 font-bold border-l-2 border-b-2 border-foreground">
                                        +{xpDisplay} XP
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg leading-tight mb-1">{badge.title}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
                                    {badge.description}
                                </p>

                                <div className="text-3xs font-bold px-2 py-0.5 mb-2 border border-foreground uppercase">
                                    {badge.category || 'BASIC'}
                                </div>

                                <div className="text-2xs font-bold bg-secondary/30 px-2 py-1 border border-foreground/30 mb-1 w-full truncate">
                                    Desafío: {badge.condition_description || conditionDisplay}
                                </div>
                                <div className="text-2xs font-bold bg-primary/20 px-2 py-1 mb-4 border border-foreground/30 w-full truncate text-primary">
                                    Premio: {badge.reward_description || `+${xpDisplay} XP`}
                                </div>

                                <div className="flex w-full gap-2 mt-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(badge)}
                                        className="flex-1"
                                    >
                                        <Edit className="w-3 h-3 mr-1" aria-hidden="true" /> EDITAR
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => onDeleteRequest(badge)}
                                        className="text-destructive hover:bg-destructive/10"
                                        aria-label={`Eliminar insignia ${badge.title}`}
                                    >
                                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && totalPages > 1 && (
                <AdminPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
            )}
        </div>
    );
}
