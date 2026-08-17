import React from 'react';
import { PixelSparklesIcon } from '@/components/PixelIcons';

/**
 * Overlay del arbol de mejoras del personaje seleccionado. Se muestra sobre
 * el panel derecho de la pantalla de seleccion de personaje.
 */
const UpgradeTree = ({ character, upgrades, onClose }) => (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-200 border-4 border-accent shadow-2xl">
        <div className="bg-accent text-accent-foreground px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <PixelSparklesIcon className="w-5 h-5 animate-pulse" />
                <h3 className="font-black text-lg uppercase tracking-wider drop-shadow-sm">Mejoras de {character.name}</h3>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="hover:bg-background/20 text-accent-foreground p-1.5 transition-colors border-2 border-transparent hover:border-accent-foreground shadow-sm hover:shadow-md"
                title="Cerrar"
            >
                <span className="font-mono text-xl font-black block px-1 leading-none">X</span>
            </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar scroll-smooth">
            <div className="relative before:absolute before:inset-y-4 before:left-[34px] before:w-1 before:bg-accent/20 space-y-3">
                {upgrades.map((upg, idx) => (
                    <div
                        key={upg.name}
                        className={`relative pl-14 pr-3 py-1  flex flex-col justify-center min-h-[4rem] animate-in slide-in-from-right-4 fade-in duration-300`}
                        style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                    >
                        {/* Timeline Node */}
                        <div className={`absolute  left-[29px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-none border-2 border-background rotate-45 z-10 ${upg.ultimate ? 'bg-accent scale-150 shadow-glow-accent' : 'bg-accent'}`} />

                        {/* Content Card */}
                        <div className={`flex text-base items-start  gap-4 p-3 border-2 ${upg.border} ${upg.bg} w-full shadow-pixel-sm hover:shadow-pixel-md transition-all hover:-translate-y-0.5 relative group bg-background/50 backdrop-blur-sm`}>
                            <div className="flex flex-col items-center justify-center gap-1 w-8 shrink-0">
                                <div className="w-8 h-8 group-hover:scale-110 transition-transform flex items-center justify-center">
                                    {upg.icon ? <upg.icon className="w-full h-full drop-shadow-sm" /> : <span className="text-2xl drop-shadow-sm">{upg.emoji}</span>}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-1.5 line-clamp-1">
                                    <span
                                        className={`font-black ml-0.5 text-base uppercase drop-shadow-md ${upg.color}`}
                                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.4), 1px -1px 0 rgba(0,0,0,0.4), -1px 1px 0 rgba(0,0,0,0.4)' }}
                                    >
                                        {upg.name}
                                    </span>
                                    <span className={`text-xs font-black uppercase px-1.5 py-0.5 border ${upg.ultimate ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-foreground/10 border-foreground/30 text-foreground'}`}>
                                        {upg.tier}
                                    </span>
                                </div>
                                <p className="text-xm text-muted-foreground leading-relaxed font-sans">{upg.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="p-3 bg-muted/40 text-center text-base text-muted-foreground uppercase border-t-2 border-accent/20">
            Asciende de nivel en la partida para desbloquear estas habilidades
        </div>
    </div>
);

export default UpgradeTree;
