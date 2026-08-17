import React from 'react';
import {
    PixelTargetIcon, PixelBookOpenIcon, PixelLightningIcon, SwordIcon, PixelFireIcon,
} from '@/components/PixelIcons';
import StatGauge from './StatGauge';
import { getPerformanceTextClass } from '@/lib/performance';

// Tarjeta grande para las métricas principales (precisión, racha, nivel).
// Antes las ~13 barras StatGauge tenían todas el mismo peso visual y el
// usuario no podía distinguir qué importaba más de un vistazo.
const PrimaryStatCard = ({ icon, label, value, valueClass = 'text-foreground' }) => (
    <div className="flex items-center gap-3 p-4 bg-card pixel-border">
        <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-accent/10 border-2 border-accent-strong/30">
            {icon}
        </div>
        <div>
            <p className={`text-2xl font-mono font-bold leading-none ${valueClass}`}>{value}</p>
            <p className="text-2xs font-mono text-muted-foreground tracking-wider mt-1">{label}</p>
        </div>
    </div>
);

const StatsTab = ({ userStats, generalAccuracy, slangAccuracy, pvAccuracy, formatTime }) => (
    <div className="space-y-6 animate-in fade-in duration-300">
        {/* ─── Métricas principales ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PrimaryStatCard
                icon={<PixelTargetIcon className="w-5 h-5 text-accent-strong" aria-hidden="true" />}
                label="Precisión General"
                value={`${generalAccuracy.toFixed(1)}%`}
                valueClass={getPerformanceTextClass(generalAccuracy)}
            />
            <PrimaryStatCard
                icon={<PixelFireIcon className="w-5 h-5 text-accent-strong" aria-hidden="true" />}
                label="Racha Actual"
                value={userStats.current_streak}
            />
            <PrimaryStatCard
                icon={<SwordIcon className="w-5 h-5 text-accent-strong" aria-hidden="true" />}
                label="Nivel"
                value={userStats.level}
            />
        </div>

        {/* ─── Métricas secundarias ─── */}
        <div className="bg-card pixel-border p-5">
            <h3 className="font-mono text-sm tracking-wider text-foreground mb-4 flex items-center gap-2">
                <PixelTargetIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> Precisión por Categoría
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatGauge label="General" value={generalAccuracy} maxValue={100} isPercentage />
                <StatGauge label="Slangs" value={slangAccuracy} maxValue={100} isPercentage />
                <StatGauge label="Phrasal Verbs" value={pvAccuracy} maxValue={100} isPercentage />
            </div>
        </div>
        <div className="bg-card pixel-border p-5">
            <h3 className="font-mono text-sm tracking-wider text-foreground mb-4 flex items-center gap-2">
                <PixelBookOpenIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> Conocimiento
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatGauge label="Slangs Dominados" value={userStats.slangs_learned || 0} maxValue={100} />
                <StatGauge label="Idioms Dominados" value={userStats.idioms_learned || 0} maxValue={50} />
                <StatGauge label="PV Dominados" value={userStats.phrasal_verbs_learned || 0} maxValue={50} />
                <StatGauge label="Vocabulario" value={userStats.vocabulary_learned || 0} maxValue={200} />
            </div>
        </div>
        <div className="bg-card pixel-border p-5">
            <h3 className="font-mono text-sm tracking-wider text-foreground mb-4 flex items-center gap-2">
                <PixelLightningIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> Actividad
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatGauge label="Palabras Vistas" value={userStats.words_seen_total || 0} maxValue={500} />
                <StatGauge label="Preguntas" value={userStats.total_questions_answered || 0} maxValue={1000} />
                <StatGauge label="Respuestas Correctas" value={userStats.correct_answers_total || 0} maxValue={userStats.total_questions_answered || 1} />
            </div>
        </div>
        <div className="bg-card pixel-border p-5">
            <h3 className="font-mono text-sm tracking-wider text-foreground mb-4 flex items-center gap-2">
                <SwordIcon className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> Combate (Acumulado)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatGauge label="Letras Eliminadas" value={userStats.total_letters_killed || 0} maxValue={5000} />
                <StatGauge label="Jefes Derrotados" value={userStats.total_bosses_killed || 0} maxValue={50} />
                <StatGauge label="Tiempo Jugado" value={userStats.total_time_played_seconds || 0} maxValue={36000} suffix={` (${formatTime(userStats.total_time_played_seconds)})`} />
            </div>
        </div>
    </div>
);

export default StatsTab;
