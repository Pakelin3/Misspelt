import React from 'react';

// Widget secundario para unirse a una granja con un código de invitación.
// Antes tenía el mismo peso visual (borde grueso + sombra) que las
// estadísticas de progreso justo debajo de la cabecera de identidad,
// compitiendo por atención con el flujo principal identidad → progreso.
// Ahora es una franja discreta, coherente con ser una acción secundaria.
const JoinFarmWidget = ({ inviteCode, setInviteCode, joinLoading, onSubmit }) => (
    <div className="bg-muted/10 border border-foreground/15 p-3 mb-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>
            <h2 className="font-mono text-2xs font-bold text-muted-foreground uppercase tracking-wider">Unirse a una Granja</h2>
            <p className="text-3xs text-muted-foreground font-mono">Ingresa el código que te dio tu instructor para conectarte.</p>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2 w-full md:w-auto">
            <label htmlFor="invite-code" className="sr-only">Código de invitación de granja</label>
            <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Código"
                maxLength={8}
                className="bg-background border-2 border-foreground/40 px-3 py-2 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary w-full md:w-40"
            />
            <button
                type="submit"
                disabled={joinLoading || !inviteCode}
                className="bg-secondary text-secondary-foreground border-2 border-foreground/40 px-4 py-3 min-h-11 font-mono font-bold text-sm hover:brightness-110 disabled:opacity-50 whitespace-nowrap transition-all"
            >
                {joinLoading ? '...' : '+ UNIRSE'}
            </button>
        </form>
    </div>
);

export default JoinFarmWidget;
