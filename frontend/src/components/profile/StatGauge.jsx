import React from 'react';
import { getPerformanceBgClass, getPerformanceTextClass } from '@/lib/performance';

// ─── Stat Gauge Component ─────────────────────────────────────
const StatGauge = ({ label, value, maxValue, suffix = '', isPercentage = false }) => {
    // Una estadistica que el backend aun no ha calculado llega como undefined o
    // null. Antes se llamaba a `value.toFixed(1)` directamente, lo que lanzaba
    // TypeError y tumbaba el arbol de React en lugar de mostrar un cero.
    const valorSeguro = Number.isFinite(Number(value)) ? Number(value) : 0;
    const percentage = maxValue > 0 ? Math.min(100, (valorSeguro / maxValue) * 100) : 0;
    const displayValue = isPercentage ? `${valorSeguro.toFixed(1)}%` : `${valorSeguro}${suffix}`;
    const color = isPercentage ? getPerformanceBgClass(valorSeguro) : 'bg-accent';
    const textColor = isPercentage ? getPerformanceTextClass(valorSeguro) : 'text-accent-strong';

    return (
        <div className="p-3 bg-muted/20 border-2 border-foreground/20 hover:border-foreground/40 transition-colors">
            <div className="flex flex-wrap justify-between items-baseline gap-x-2 mb-1.5">
                <span className="text-2xs font-mono text-muted-foreground uppercase tracking-wider min-w-0 break-words">{label}</span>
                <span className={`text-sm font-mono font-bold ${textColor}`}>{displayValue}</span>
            </div>
            <div className="w-full h-2 bg-muted border border-foreground/20 relative">
                <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

export default StatGauge;
