import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    TrophyIcon,
    PixelStarIcon,
    PixelClockIcon,
    PixelTargetIcon,
    SwordIcon,
    BookIcon,
    PixelRestartIcon,
    PixelHomeIcon,
} from '@/components/PixelIcons';
import { getPerformanceTextClass } from '@/lib/performance';

const formatTime = (s) => {
    if (!s) return '0:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Pantalla de resultados al terminar una partida. `seenWordsRef` y
 * `correctWordsRef` son los mismos refs que llena el puente de Godot durante
 * la partida (ver useGodotBridge); se leen aqui una sola vez para el resumen.
 */
const GameResults = ({ results, seenWordsRef, correctWordsRef, onPlayAgain, onGoHome }) => {
    const totalQuestions = Array.from(seenWordsRef.current).length;
    const correctAnswers = Array.from(correctWordsRef.current).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const accColor = getPerformanceTextClass(accuracy);

    const breakdown = results.breakdown;

    return (
        <div className="flex flex-col items-center justify-center h-full animate-in rounded-none fade-in zoom-in duration-300 p-4">
            <Card className="w-full max-w-2xl rounded-none border-4 border-primary bg-background p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-center gap-3 border-b-4 border-foreground">
                    <TrophyIcon aria-hidden="true" className="w-8 h-8 motion-safe:animate-in motion-safe:zoom-in-50 duration-700 ease-out" />
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider">Resumen de Partida</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                            <PixelStarIcon aria-hidden="true" className="w-5 h-5 text-accent-strong mx-auto mb-1" />
                            <p className="text-2xs uppercase font-bold text-muted-foreground">XP Ganada</p>
                            <p className="text-2xl font-black text-primary">+{results.xp_earned}</p>
                        </div>
                        <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                            <TrophyIcon className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-2xs uppercase font-bold text-muted-foreground">Nivel</p>
                            <p className="text-2xl font-black text-foreground">{results.level}</p>
                        </div>
                        <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                            <PixelClockIcon aria-hidden="true" className="w-5 h-5 text-info mx-auto mb-1" />
                            <p className="text-2xs uppercase font-bold text-muted-foreground">Tiempo</p>
                            <p className="text-2xl font-black text-foreground">{formatTime(results.time_spent)}</p>
                        </div>
                        <div className="bg-muted/50 p-4 border-2 border-foreground/30 text-center">
                            <PixelTargetIcon aria-hidden="true" className="w-5 h-5 text-destructive mx-auto mb-1" />
                                <p className="text-2xs font-bold text-muted-foreground">Precisión</p>
                            <p className={`text-2xl font-black ${accColor}`}>{accuracy}%</p>
                        </div>
                    </div>

                    {/* Combat Stats */}
                    <div className="bg-muted/20 border-2 border-foreground/20 p-4">
                        <p className="flex items-center gap-1 text-2xs font-bold uppercase text-muted-foreground mb-3 tracking-wider"><SwordIcon className="w-3 h-3" /> Combate</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xl font-black text-foreground">{correctAnswers}/{totalQuestions}</p>
                                <p className="text-2xs text-muted-foreground uppercase">Preguntas</p>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground">{results.breakdown?.seen?.SLANG ? Object.values(results.breakdown.seen).reduce((a, b) => a + b, 0) : 0}</p>
                                <p className="text-2xs text-muted-foreground uppercase">Letras Vistas</p>
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground">{results.killCount}</p>
                                <p className="text-2xs text-muted-foreground uppercase">Palabras Asesinadas</p>
                            </div>
                        </div>
                    </div>

                    {/* Word Breakdown */}
                    {breakdown && (
                        <div className="bg-muted/20 border-2 border-foreground/20 p-4">
                            <p className="flex items-center gap-1 text-2xs font-bold uppercase text-muted-foreground mb-3 tracking-wider"><BookIcon className="w-3 h-3" /> Desglose por tipo</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                    { label: 'Slangs', key: 'SLANG', color: 'text-word-slang' },
                                    { label: 'Idioms', key: 'IDIOM', color: 'text-word-idiom' },
                                    { label: 'P. Verbs', key: 'PHRASAL_VERB', color: 'text-word-noun' },
                                    { label: 'Vocab', key: 'VOCABULARY', color: 'text-word-verb' },
                                ].map(cat => (
                                    <div key={cat.key} className="text-center p-2 bg-background border border-foreground/10">
                                        <p className={`text-lg font-black ${cat.color}`}>
                                            {breakdown.correct?.[cat.key] || 0}/{breakdown.seen?.[cat.key] || 0}
                                        </p>
                                        <p className="text-3xs text-muted-foreground uppercase">{cat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            onClick={onPlayAgain}
                            className="flex-1 h-12 text-base pixel-btn rounded-none shadow-pixel-sm hover:translate-y-[2px] hover:shadow-pixel-xs transition-all"
                        >
                            <PixelRestartIcon className="mr-2 w-5 h-5" /> JUGAR DE NUEVO
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onGoHome}
                            className="flex-1 h-12 text-base pixel-btn rounded-none border-2 border-foreground hover:bg-muted"
                        >
                            <PixelHomeIcon className="mr-2 w-5 h-5" /> IR AL HOME
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default GameResults;
