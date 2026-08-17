import React from 'react';
import { PixelBookOpenIcon, SwordIcon } from '@/components/PixelIcons';
import { getPerformanceTextClass } from '@/lib/performance';

const HistoryTab = ({
    historyLoading,
    gameHistory,
    historyCount,
    historyPage,
    historyPrev,
    historyNext,
    onFetchHistory,
    getAccuracy,
    formatTime,
    formatDate,
}) => {
    if (historyLoading) {
        return (
            <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 gap-3 animate-in fade-in duration-300">
                <div aria-hidden="true" className="w-10 h-10 border-4 border-accent-strong border-t-transparent motion-safe:animate-spin rounded-full" />
                <p className="font-mono text-xs text-muted-foreground animate-pulse">CARGANDO HISTORIAL...</p>
            </div>
        );
    }

    if (gameHistory.length === 0) {
        return (
            <div className="text-center p-12 bg-card pixel-border text-muted-foreground animate-in fade-in duration-300">
                <PixelBookOpenIcon className="w-10 h-10 mb-3 mx-auto text-muted-foreground/50" aria-hidden="true" />
                <p className="font-mono text-sm">Aún no has jugado ninguna partida.</p>
                <p className="text-xs mt-1">¡Ve a jugar y tu historial aparecerá aquí!</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="space-y-3">
                {gameHistory.map(game => {
                    const accuracy = getAccuracy(game.correct_in_game, game.total_questions_in_game);
                    const accColor = getPerformanceTextClass(accuracy);
                    const isSurvivor = game.game_mode === 'SURVIVOR';
                    const modeColor = isSurvivor ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-info/50 bg-info/10 text-info';

                    return (
                        <div key={game.id} className="bg-card pixel-border p-4 flex flex-col gap-4 hover:bg-muted/20 transition-colors">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className={`w-12 h-12 flex items-center justify-center border-2 shrink-0 ${modeColor}`}>
                                    {isSurvivor ? <SwordIcon className="w-6 h-6" aria-hidden="true" /> : <PixelBookOpenIcon className="w-6 h-6" aria-hidden="true" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-2xs font-mono font-bold px-1.5 py-0.5 border ${isSurvivor ? 'border-destructive/50 text-destructive' : 'border-info/50 text-info'}`}>
                                            {isSurvivor ? 'SURVIVOR' : 'QUIZ'}
                                        </span>
                                        <span className="text-2xs text-muted-foreground font-mono">{formatDate(game.played_at)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                                        {game.total_questions_in_game > 0 && (
                                            <span>Preguntas: <span className="text-foreground font-bold">{game.correct_in_game}/{game.total_questions_in_game}</span></span>
                                        )}
                                        {game.time_spent_seconds > 0 && (
                                            <span>Tiempo: <span className="text-foreground font-bold">{formatTime(game.time_spent_seconds)}</span></span>
                                        )}
                                        {isSurvivor && game.letters_killed > 0 && (
                                            <span>Letras: <span className="text-foreground font-bold">{game.letters_killed}</span></span>
                                        )}
                                        {isSurvivor && game.bosses_killed > 0 && (
                                            <span>Jefes: <span className="text-foreground font-bold">{game.bosses_killed}</span></span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    {game.total_questions_in_game > 0 && (
                                        <div className="text-right">
                                            <p className={`font-mono text-lg font-bold ${accColor}`}>{accuracy.toFixed(0)}%</p>
                                                <p className="text-3xs font-mono text-muted-foreground ">Precisión</p>
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <p className="font-mono text-lg font-bold text-accent-strong">+{game.score}</p>
                                        <p className="text-3xs font-mono text-muted-foreground uppercase">XP</p>
                                    </div>
                                </div>
                            </div>
                            {game.ai_evaluation && (() => {
                                const aiEval = game.ai_evaluation.evaluacion || game.ai_evaluation;
                                const quality = aiEval.calidad || 0;
                                const qualityColor = getPerformanceTextClass(quality);

                                return (
                                    <div className="mt-2 pt-3 border-t-2 border-dashed border-foreground/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm" aria-hidden="true">🔮</span>
                                                <span className="text-2xs font-mono font-bold text-primary tracking-wider">Evaluación del Oráculo</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="md:col-span-2">
                                                <p className="text-sm leading-relaxed border-l-2 border-primary pl-3 italic text-foreground/90">
                                                    "{aiEval.feedback_general}"
                                                </p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div>
                                                    <p className="text-2xs uppercase font-mono text-muted-foreground mb-1">Calidad</p>
                                                    <div className={`text-base font-bold ${qualityColor}`}>{quality}/100</div>
                                                </div>
                                                <div>
                                                    <p className="text-2xs uppercase font-mono text-muted-foreground mb-1">Feedback</p>
                                                    <div className="text-sm font-bold text-foreground">{aiEval.consistencia}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>
            {historyCount > 5 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-foreground/20">
                    <button
                        onClick={() => onFetchHistory(historyPage - 1)}
                        disabled={!historyPrev}
                        className="px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-foreground bg-card hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed pixel-border"
                    >
                        ◀ Anterior
                    </button>
                    <span className="font-mono text-xs text-muted-foreground">
                        Página {historyPage} de {Math.ceil(historyCount / 5)}
                    </span>
                    <button
                        onClick={() => onFetchHistory(historyPage + 1)}
                        disabled={!historyNext}
                        className="px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-foreground bg-card hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed pixel-border"
                    >
                        Siguiente ▶
                    </button>
                </div>
            )}
        </div>
    );
};

export default HistoryTab;
