// Cada icono propaga `...props` al <svg>: sin eso, un `aria-hidden` o un
// `aria-label` escrito en el punto de uso se descartaba en silencio, que es
// justo lo contrario de lo que espera quien lo escribe. Mismo patrón que
// `@/components/PixelIcons`.
import React from "react";

export function VillagerIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sombrero */}
      <rect x="4" y="4" width="16" height="4" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="7" y="2" width="10" height="2" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Cara */}
      <rect x="6" y="8" width="12" height="10" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Ojos */}
      <rect x="9" y="11" width="2" height="2" fill="hsl(var(--foreground))" />
      <rect x="13" y="11" width="2" height="2" fill="hsl(var(--foreground))" />
      {/* Barba/Boca */}
      <rect x="8" y="15" width="8" height="2" fill="hsl(var(--muted-foreground))" />
    </svg>
  );
}

export function SignalIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg className={className} {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="16" width="4" height="6" fill="hsl(var(--destructive))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="8" y="12" width="4" height="10" fill="hsl(var(--accent))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="14" y="8" width="4" height="14" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="20" y="2" width="4" height="20" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}
