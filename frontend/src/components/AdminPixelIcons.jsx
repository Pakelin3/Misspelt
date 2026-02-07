import React from "react";

export function VillagerIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export function SignalIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="16" width="4" height="6" fill="hsl(var(--destructive))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="8" y="12" width="4" height="10" fill="hsl(var(--accent))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="14" y="8" width="4" height="14" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="20" y="2" width="4" height="20" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}

export function ScrollIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Papel */}
      <path d="M5 4H17C18.1046 4 19 4.89543 19 6V20C19 21.1046 18.1046 22 17 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Líneas de texto */}
      <path d="M7 9H15" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 13H15" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 17H12" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
      {/* Sello */}
      <circle cx="16" cy="18" r="3" fill="hsl(var(--destructive))" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}

export function MedalRibbonIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Listón */}
      <path d="M12 2L5 12H19L12 2Z" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Medalla */}
      <circle cx="12" cy="16" r="6" fill="hsl(var(--accent))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Estrella interior */}
      <path d="M12 13L13 15H15L13.5 16.5L14 18.5L12 17.5L10 18.5L10.5 16.5L9 15H11L12 13Z" fill="hsl(var(--card))" />
    </svg>
  );
}