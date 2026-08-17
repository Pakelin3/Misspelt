import React from 'react';
import { getPerformanceBgClass, getPerformanceTextClass } from '@/lib/performance';

// ─── Stat Gauge Component ─────────────────────────────────────
const StatGauge = ({ label, value, maxValue, suffix = '', isPercentage = false }) => {
    const percentage = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
    const displayValue = isPercentage ? `${value.toFixed(1)}%` : `${value}${suffix}`;
    const color = isPercentage ? getPerformanceBgClass(value) : 'bg-accent';
    const textColor = isPercentage ? getPerformanceTextClass(value) : 'text-accent';

    return (
        <div className="p-3 bg-muted/20 border-2 border-foreground/20 hover:border-foreground/40 transition-colors">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-2xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className={`text-sm font-mono font-bold ${textColor}`}>{displayValue}</span>
            </div>
            <div className="w-full h-2 bg-muted border border-foreground/20 relative">
                <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
};

export default StatGauge;
