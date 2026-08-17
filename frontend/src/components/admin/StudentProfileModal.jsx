import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { Loader2 } from 'lucide-react';
import { PixelTargetIcon, SwordIcon, TrophyIcon, BrainIcon, PixelClockIcon, PixelBookOpenIcon } from '@/components/PixelIcons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

export default function StudentProfileModal({ farmId, studentId, onClose }) {
    const api = useAxios();
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState(null);
    const [historyPage, setHistoryPage] = useState(1);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const res = await api.get(`/farms/${farmId}/student-detail/${studentId}/?page=${historyPage}`);
                setStudentData(res.data);
            } catch (error) {
                console.error("Error cargando perfil del estudiante:", error);
                toast.error("No se pudo cargar la información del estudiante");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        fetchStudentDetails();
    }, [farmId, studentId, historyPage, api, onClose]);

    if (loading && !studentData) {
        return (
            <Dialog open onOpenChange={(open) => !open && onClose()}>
                <DialogContent showCloseButton={false} className="max-w-sm p-8">
                    <DialogTitle className="sr-only">Cargando perfil del estudiante</DialogTitle>
                    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" aria-hidden="true" />
                        <p className="font-mono text-lg animate-pulse">Cargando datos...</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!studentData) return null;

    const { username, avatar_url, stats, recent_history, total_battles } = studentData;

    // Calcular precision global
    const calcAccuracy = (stats) => {
        if (!stats || stats.total_questions_answered === 0) return 0;
        return Math.round((stats.correct_answers_total / stats.total_questions_answered) * 100);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const accuracy = calcAccuracy(stats);

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[85dvh] max-h-none flex flex-col p-0 gap-0">
                {/* Header */}
                <DialogHeader className="bg-primary/90 border-b-4 border-foreground p-4 md:p-6 flex-row justify-between items-center shrink-0 relative overflow-hidden mb-0 pb-4 md:pb-6 gap-4">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 border-4 border-background bg-muted overflow-hidden shadow-pixel-md-left pixel-rendering shrink-0">
                            <img src={avatar_url} alt="Avatar del estudiante" width={64} height={64} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <DialogTitle className="font-mono text-2xl md:text-3xl font-black text-primary-foreground tracking-widest uppercase drop-shadow-md">
                                @{username}
                            </DialogTitle>
                            <p className="text-sm font-bold opacity-90 text-background flex items-center gap-2">
                                <span className="bg-background text-foreground px-2 py-0.5 rounded-sm">Nivel {stats?.level || 1}</span>
                                <span className="drop-shadow-sm">{stats?.experience || 0} XP Total</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[url('/pattern.png')] custom-scrollbar flex flex-col gap-6">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-pixel-md hover:-translate-y-1 hover:shadow-pixel-lg transition-all group">
                            <PixelTargetIcon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{accuracy}%</span>
                            <span className="text-2xs md:text-xs uppercase font-bold text-muted-foreground text-center">Precisión Total</span>
                        </div>
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-pixel-md hover:-translate-y-1 hover:shadow-pixel-lg transition-all group">
                            <SwordIcon className="w-8 h-8 text-destructive group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{total_battles || 0}</span>
                            <span className="text-2xs md:text-xs uppercase font-bold text-muted-foreground text-center">Partidas</span>
                        </div>
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-pixel-md hover:-translate-y-1 hover:shadow-pixel-lg transition-all group">
                            <TrophyIcon className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{stats?.total_bosses_killed || 0}</span>
                            <span className="text-2xs md:text-xs uppercase font-bold text-muted-foreground text-center">Jefes Derrotados</span>
                        </div>
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-pixel-md hover:-translate-y-1 hover:shadow-pixel-lg transition-all group">
                            <BrainIcon className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{stats?.unlocked_words?.length || 0}</span>
                            <span className="text-2xs md:text-xs uppercase font-bold text-muted-foreground text-center">Palabras Aprendidas</span>
                        </div>
                    </div>

                    {/* Interactive History List */}
                    <div className="bg-muted border-4 border-foreground p-4 shadow-pixel-lg flex flex-col gap-4">
                        <h3 className="font-mono text-xl uppercase font-black border-b-4 border-foreground pb-2 flex items-center gap-3">
                            <PixelClockIcon className="w-6 h-6 text-foreground" /> Últimas Partidas
                        </h3>
                        {(!recent_history || recent_history.length === 0) ? (
                            <div className="text-center font-mono py-10 opacity-60">
                                <p>Este estudiante aún no ha librado ninguna batalla.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 pr-2">
                                    {recent_history.map(game => {
                                        const accuracy = game.total_questions_in_game > 0 ? Math.round((game.correct_in_game / game.total_questions_in_game) * 100) : 0;
                                        const accColor = accuracy >= 80 ? 'text-success' : accuracy >= 50 ? 'text-warning' : 'text-destructive';
                                        const isSurvivor = game.game_mode === 'SURVIVOR';

                                        return (
                                            <div key={game.id} className="bg-card pixel-border border-4 border-foreground p-4 flex flex-col gap-4 hover:translate-x-1 transition-transform relative overflow-hidden group shadow-pixel-sm">
                                                <div className="absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                                                    <div className={`
                                                        w-12 h-12 flex items-center justify-center border-2 shrink-0
                                                        ${isSurvivor ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-info/50 bg-info/10 text-info'}
                                                    `}>
                                                        {isSurvivor ? <SwordIcon className="w-6 h-6" aria-hidden="true" /> : <PixelBookOpenIcon className="w-6 h-6" aria-hidden="true" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-2xs font-mono font-bold px-1.5 py-0.5 border ${isSurvivor ? 'border-destructive/50 text-destructive' : 'border-info/50 text-info'}`}>
                                                                {isSurvivor ? 'SURVIVOR' : 'QUIZ'}
                                                            </span>
                                                            <span className="text-2xs text-muted-foreground font-mono">{new Date(game.played_at).toLocaleDateString()}</span>
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
                                                                <p className={`font-mono text-lg font-bold ${accColor}`}>{accuracy}%</p>
                                                                <p className="text-3xs font-mono text-muted-foreground uppercase">Precisión</p>
                                                            </div>
                                                        )}
                                                        <div className="text-right">
                                                            <p className="font-mono text-lg font-bold text-accent">+{game.score}</p>
                                                            <p className="text-3xs font-mono text-muted-foreground uppercase">XP</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {total_battles > 5 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-foreground/20">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                                            disabled={historyPage === 1}
                                        >
                                            ◀ Anterior
                                        </Button>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            Página {historyPage} de {Math.ceil(total_battles / 5)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(prev => prev + 1)}
                                            disabled={historyPage >= Math.ceil(total_battles / 5)}
                                        >
                                            Siguiente ▶
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}
