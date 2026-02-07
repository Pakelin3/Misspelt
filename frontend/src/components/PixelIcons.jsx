import React from "react";

/* PIXEL ICONS LIBRARY
  Estos iconos usan tus variables CSS (hsl var(--primary)) para colorearse.
*/

export function BookIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="20" rx="1" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M8 2V22" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="10" y="6" width="6" height="2" fill="hsl(var(--primary))" />
      <rect x="10" y="10" width="8" height="2" fill="hsl(var(--muted-foreground))" />
      <rect x="10" y="14" width="6" height="2" fill="hsl(var(--muted-foreground))" />
    </svg>
  );
}

export function BrainIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M12 16V12" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M8 12C8 12 10 10 12 10C14 10 16 12 16 12" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <circle cx="12" cy="7" r="1.5" fill="hsl(var(--primary))" />
      <path d="M7 14.5C7 14.5 9 17 12 17C15 17 17 14.5 17 14.5" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2H16V10C16 13 14 15 12 15C10 15 8 13 8 10V2Z" fill="hsl(var(--accent))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M16 4H19C20.1046 4 21 4.89543 21 6V7C21 8.10457 20.1046 9 19 9H16" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M8 4H5C3.89543 4 3 4.89543 3 6V7C3 8.10457 3.89543 9 5 9H8" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M12 15V19" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <rect x="8" y="19" width="8" height="3" fill="hsl(var(--foreground))" />
    </svg>
  );
}

export function StarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="hsl(var(--accent))" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}

export function SwordIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Blade */}
      <path d="M12 3L14 15H10L12 3Z" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Guard */}
      <rect x="8" y="15" width="8" height="2" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      {/* Handle */}
      <rect x="11" y="17" width="2" height="4" fill="hsl(var(--foreground))" />
      {/* Pommel */}
      <circle cx="12" cy="22" r="1.5" fill="hsl(var(--accent))" />
    </svg>
  );
}

export function HeartIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="hsl(var(--destructive))" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}

export function LeafIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21V10" stroke="hsl(var(--foreground))" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 10C12 5 8 2 3 2C3 7 6 11 12 12" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      <path d="M12 10C12 5 16 2 21 2C21 7 18 11 12 12" fill="hsl(var(--primary))" fillOpacity="0.7" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}

export function GearIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cuerpo del engranaje */}
      <circle cx="12" cy="12" r="5" fill="hsl(var(--secondary))" stroke="hsl(var(--foreground))" strokeWidth="2" />
      
      {/* Dientes del engranaje (Estilo cuadrado para look pixel) */}
      <path d="M11 2H13V5H11V2Z" fill="hsl(var(--foreground))" />
      <path d="M11 19H13V22H11V19Z" fill="hsl(var(--foreground))" />
      <path d="M22 11V13H19V11H22Z" fill="hsl(var(--foreground))" />
      <path d="M5 11V13H2V11H5Z" fill="hsl(var(--foreground))" />
      
      {/* Dientes diagonales */}
      <rect x="16.5" y="5.5" width="2" height="3" transform="rotate(45 16.5 5.5)" fill="hsl(var(--foreground))" />
      <rect x="5.5" y="16.5" width="2" height="3" transform="rotate(45 5.5 16.5)" fill="hsl(var(--foreground))" />
      <rect x="16.5" y="18.5" width="2" height="3" transform="rotate(135 16.5 18.5)" fill="hsl(var(--foreground))" />
      <rect x="5.5" y="7.5" width="2" height="3" transform="rotate(135 5.5 7.5)" fill="hsl(var(--foreground))" />

      {/* Agujero central */}
      <circle cx="12" cy="12" r="2" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="2" />
    </svg>
  );
}