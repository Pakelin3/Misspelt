import React from 'react';

// ─── Tab Button ───────────────────────────────────────────────
const TabButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        aria-pressed={active}
        className={`
            px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all border-b-4
            ${active
                ? 'border-primary text-primary bg-primary/10 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
            }
        `}
    >
        {children}
    </button>
);

export default TabButton;
