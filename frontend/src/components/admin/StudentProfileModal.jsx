import React, { useState, useEffect } from 'react';
import useAxios from '@/utils/useAxios';
import { Loader2, X } from 'lucide-react';
import { PixelTargetIcon, SwordIcon, TrophyIcon, BrainIcon, PixelClockIcon, PixelBookOpenIcon } from '@/components/PixelIcons';
import { toast } from 'sonner';

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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[70]">
                <div className="p-8 bg-card pixel-border border-4 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="font-mono text-lg animate-pulse">Cargando datos...</p>
                </div>
            </div>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[70] p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="relative bg-card pixel-border border-4 border-foreground w-full max-w-4xl h-[85vh] flex flex-col shadow-[12px_12px_0_0_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-primary/90 border-b-4 border-foreground p-4 md:p-6 flex justify-between items-center shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 border-4 border-background bg-muted overflow-hidden shadow-[-4px_4px_0_0_rgba(0,0,0,0.5)] pixel-rendering">
                            <img src={avatar_url} alt="Student Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="font-mono text-2xl md:text-3xl font-black text-primary-foreground tracking-widest uppercase shadow-black drop-shadow-md">
                                @{username}
                            </h2>
                            <p className="text-sm font-bold opacity-90 text-background flex items-center gap-2">
                                <span className="bg-background text-foreground px-2 py-0.5 rounded-sm">Nivel {stats?.level || 1}</span>
                                <span className="drop-shadow-sm">{stats?.experience || 0} XP Total</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="flex items-center justify-center hover:bg-red-500 hover:text-white px-2 py-1 font-mono  border-2 border-transparent hover:border-foreground transition-colors">
                        X
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[url('/pattern.png')] custom-scrollbar flex flex-col gap-6">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all group">
                            <PixelTargetIcon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{accuracy}%</span>
                            <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground text-center">Precisión Total</span>
                        </div>
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all group">
                            <SwordIcon className="w-8 h-8 text-destructive group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{total_battles || 0}</span>
                            <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground text-center">Partidas</span>
                        </div>
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all group">
                            <TrophyIcon className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{stats?.total_bosses_killed || 0}</span>
                            <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground text-center">Jefes Derrotados</span>
                        </div>
                        <div className="bg-card border-4 border-foreground p-4 flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all group">
                            <BrainIcon className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-2xl md:text-3xl font-black">{stats?.unlocked_words?.length || 0}</span>
                            <span className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground text-center">Palabras Aprendidas</span>
                        </div>
                    </div>

                    {/* Interactive History List */}
                    <div className="bg-muted border-4 border-foreground p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex flex-col gap-4">
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
                                        const accColor = accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-500';
                                        const isSurvivor = game.game_mode === 'SURVIVOR';

                                        return (
                                            <div key={game.id} className="bg-card pixel-border border-4 border-foreground p-4 flex flex-col gap-4 hover:translate-x-1 transition-transform relative overflow-hidden group shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                                                <div className="absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                                                    <div className={`
                                                        w-12 h-12 flex items-center justify-center border-2 shrink-0
                                                        ${isSurvivor ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-blue-500/50 bg-blue-500/10 text-blue-500'}
                                                    `}>
                                                        {isSurvivor ? <SwordIcon className="w-6 h-6" /> : <PixelBookOpenIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${isSurvivor ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'}`}>
                                                                {isSurvivor ? 'SURVIVOR' : 'QUIZ'}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(game.played_at).toLocaleDateString()}</span>
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
                                                                <p className="text-[9px] font-mono text-muted-foreground uppercase">Precisión</p>
                                                            </div>
                                                        )}
                                                        <div className="text-right">
                                                            <p className="font-mono text-lg font-bold text-accent">+{game.score}</p>
                                                            <p className="text-[9px] font-mono text-muted-foreground uppercase">XP</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {total_battles > 5 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-foreground/20">
                                        <button
                                            onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                                            disabled={historyPage === 1}
                                            className="px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-foreground bg-card hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed pixel-border"
                                        >
                                            ◀ Anterior
                                        </button>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            Página {historyPage} de {Math.ceil(total_battles / 5)}
                                        </span>
                                        <button
                                            onClick={() => setHistoryPage(prev => prev + 1)}
                                            disabled={historyPage >= Math.ceil(total_battles / 5)}
                                            className="px-4 py-2 font-mono text-xs uppercase tracking-wider border-2 border-foreground bg-card hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed pixel-border"
                                        >
                                            Siguiente ▶
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
