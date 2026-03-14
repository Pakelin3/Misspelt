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
      <path d="M13 22H11V20H13V22ZM11 20H9V18H11V20ZM15 20H13V18H15V20ZM9 18H7V16H9V18ZM17 18H15V16H17V18ZM7 16H5V14H7V16ZM19 16H17V14H19V16ZM5 14H3V12H5V14ZM21 14H19V12H21V14ZM3 12H1V6H3V12ZM23 12H21V6H23V12ZM13 8H11V6H13V8ZM5 6H3V4H5V6ZM11 6H9V4H11V6ZM15 6H13V4H15V6ZM21 6H19V4H21V6ZM9 4H5V2H9V4ZM19 4H15V2H19V4Z" fill="black" />
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
      <rect x="9" y="11" width="2" height="2" fill="black" />
      <rect x="13" y="11" width="2" height="2" fill="black" />
      <rect x="5" y="7" width="14" height="2" fill="black" />
      <rect x="5" y="9" width="2" height="6" fill="black" />
      <rect x="5" y="15" width="14" height="2" fill="black" />
      <rect x="17" y="9" width="2" height="6" fill="black" />
      <rect x="11" y="5" width="2" height="2" fill="black" />
      <rect x="2" y="2" width="6" height="2" fill="black" />
      <rect x="2" y="20" width="6" height="2" fill="black" />
      <rect x="16" y="2" width="6" height="2" fill="black" />
      <rect x="16" y="20" width="6" height="2" fill="black" />
      <rect x="2" y="4" width="2" height="4" fill="black" />
      <rect x="2" y="16" width="2" height="4" fill="black" />
      <rect x="20" y="4" width="2" height="4" fill="black" />
      <rect x="20" y="16" width="2" height="4" fill="black" />
    </svg>

  );
}

export function PixelCrownIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="2" height="12" fill="currentColor" />
      <rect x="19" y="3" width="2" height="12" fill="currentColor" />
      <rect x="11" y="3" width="2" height="2" fill="currentColor" />
      <rect x="9" y="5" width="2" height="2" fill="currentColor" />
      <rect x="5" y="5" width="2" height="2" fill="currentColor" />
      <rect x="3" y="3" width="2" height="2" fill="currentColor" />
      <rect x="7" y="7" width="2" height="2" fill="currentColor" />
      <rect x="13" y="5" width="2" height="2" fill="currentColor" />
      <rect x="15" y="7" width="2" height="2" fill="currentColor" />
      <rect x="17" y="5" width="2" height="2" fill="currentColor" />
      <rect x="5" y="15" width="14" height="2" fill="currentColor" />
      <rect x="3" y="19" width="18" height="2" fill="currentColor" />
    </svg>
  )
}

export function PixelHeartIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6H10V8H14V6H18V10H20V14H18V16H16V18H14V20H10V18H8V16H6V14H4V10H6V6Z" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}

export function PixelHeartFillIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6H10V8H14V6H18V10H20V14H18V16H16V18H14V20H10V18H8V16H6V14H4V10H6V6Z" fill="#ad46ff" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}

export function PixelDiamondIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="1" width="10" height="2" fill="#2B7FFF" />
      <rect x="5" y="3" width="2" height="2" fill="#2B7FFF" />
      <rect x="17" y="3" width="2" height="2" fill="#2B7FFF" />
      <rect x="19" y="5" width="2" height="2" fill="#2B7FFF" />
      <rect x="19" y="13" width="2" height="2" fill="#2B7FFF" />
      <rect x="17" y="15" width="2" height="2" fill="#2B7FFF" />
      <rect x="15" y="17" width="2" height="2" fill="#2B7FFF" />
      <rect x="13" y="19" width="2" height="2" fill="#2B7FFF" />
      <rect x="11" y="21" width="2" height="2" fill="#2B7FFF" />
      <rect x="9" y="19" width="2" height="2" fill="#2B7FFF" />
      <rect x="7" y="17" width="2" height="2" fill="#2B7FFF" />
      <rect x="5" y="15" width="2" height="2" fill="#2B7FFF" />
      <rect x="3" y="13" width="2" height="2" fill="#2B7FFF" />
      <rect x="3" y="5" width="2" height="2" fill="#2B7FFF" />
      <rect x="1" y="7" width="2" height="6" fill="#2B7FFF" />
      <rect x="21" y="7" width="2" height="6" fill="#2B7FFF" />
      <rect x="3" y="9" width="18" height="2" fill="#2B7FFF" />
      <rect x="9" y="3" width="2" height="3" fill="#2B7FFF" />
      <rect x="7" y="6" width="2" height="3" fill="#2B7FFF" />
      <rect x="15" y="6" width="2" height="3" fill="#2B7FFF" />
      <rect x="7" y="11" width="2" height="2" fill="#2B7FFF" />
      <rect x="9" y="13" width="2" height="3" fill="#2B7FFF" />
      <rect x="11" y="16" width="2" height="3" fill="#2B7FFF" />
      <rect x="13" y="13" width="2" height="3" fill="#2B7FFF" />
      <rect x="15" y="11" width="2" height="2" fill="#2B7FFF" />
      <rect x="13" y="3" width="2" height="3" fill="#2B7FFF" />
    </svg>
  );
}

export function PixelStarIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="1" width="2" height="4" fill="currentColor" />
      <rect width="2" height="4" transform="matrix(1 0 0 -1 11 23)" fill="currentColor" />
      <rect x="9" y="5" width="2" height="4" fill="currentColor" />
      <rect width="2" height="4" transform="matrix(1 0 0 -1 9 19)" fill="currentColor" />
      <rect x="13" y="5" width="2" height="4" fill="currentColor" />
      <rect width="2" height="4" transform="matrix(1 0 0 -1 13 19)" fill="currentColor" />
      <rect x="5" y="9" width="4" height="2" fill="currentColor" />
      <rect width="4" height="2" transform="matrix(-1 0 0 1 19 9)" fill="currentColor" />
      <rect x="1" y="11" width="4" height="2" fill="currentColor" />
      <rect width="4" height="2" transform="matrix(-1 0 0 1 23 11)" fill="currentColor" />
      <rect x="5" y="13" width="4" height="2" fill="currentColor" />
      <rect width="4" height="2" transform="matrix(-1 0 0 1 19 13)" fill="currentColor" />
      <rect x="19" y="1" width="2" height="6" fill="currentColor" />
      <rect x="17" y="3" width="6" height="2" fill="currentColor" />
      <rect x="3" y="17" width="2" height="2" fill="currentColor" />
      <rect x="1" y="19" width="2" height="2" fill="currentColor" />
      <rect x="3" y="21" width="2" height="2" fill="currentColor" />
      <rect x="5" y="19" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

export function PixelShieldIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="16" height="2" fill="black" />
      <rect x="2" y="4" width="2" height="10" fill="black" />
      <rect x="20" y="4" width="2" height="10" fill="black" />
      <rect x="4" y="14.0001" width="2" height="2" fill="black" />
      <rect x="6" y="16.0001" width="2" height="2" fill="black" />
      <rect x="10" y="20" width="4" height="2" fill="black" />
      <rect width="2" height="2" transform="matrix(-1 0 0 1 20 14.0001)" fill="black" />
      <rect width="2" height="2" transform="matrix(-1 0 0 1 18 16.0001)" fill="black" />
      <rect width="2" height="2" transform="matrix(-1 0 0 1 16 18)" fill="black" />
      <rect width="2" height="2" transform="matrix(-1 0 0 1 10 18)" fill="black" />
    </svg>
  );
}

export function PixelChevronIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={`transition-transform duration-300 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 16H11V14H13V16ZM11 14H9V12H11V14ZM15 14H13V12H15V14ZM9 12H7V10H9V12ZM17 12H15V10H17V12ZM7 10H5V8H7V10ZM19 10H17V8H19V10Z" fill="black" />
    </svg>
  );
}

export function PixelMicIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="2" width="4" height="2" fill="black" />
      <rect x="8" y="4" width="2" height="10" fill="black" />
      <rect x="10" y="14" width="4" height="2" fill="black" />
      <rect x="14" y="4" width="2" height="10" fill="black" />
      <rect x="4" y="10" width="2" height="6" fill="black" />
      <rect x="6" y="16" width="2" height="2" fill="black" />
      <rect x="8" y="18" width="8" height="2" fill="black" />
      <rect x="16" y="16" width="2" height="2" fill="black" />
      <rect x="18" y="10" width="2" height="6" fill="black" />
      <rect x="11" y="20" width="2" height="2" fill="black" />
    </svg>
  );
}

export function PixelMicOffIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="2" width="4" height="2" fill="black" />
      <rect x="8" y="8" width="2" height="6" fill="black" />
      <rect x="10" y="14" width="4" height="2" fill="black" />
      <rect x="14" y="4" width="2" height="6" fill="black" />
      <rect x="4" y="10" width="2" height="6" fill="black" />
      <rect x="6" y="16" width="2" height="2" fill="black" />
      <rect x="8" y="18" width="8" height="2" fill="black" />
      <rect x="16" y="16" width="2" height="2" fill="black" />
      <rect x="14" y="14" width="2" height="2" fill="black" />
      <rect x="12" y="12" width="2" height="2" fill="black" />
      <rect x="10" y="10" width="2" height="2" fill="black" />
      <rect x="8" y="8" width="2" height="2" fill="black" />
      <rect x="6" y="6" width="2" height="2" fill="black" />
      <rect x="4" y="4" width="2" height="2" fill="black" />
      <rect x="2" y="2" width="2" height="2" fill="black" />
      <rect x="18" y="18" width="2" height="2" fill="black" />
      <rect x="20" y="20" width="2" height="2" fill="black" />
      <rect x="18" y="10" width="2" height="4" fill="black" />
      <rect x="11" y="20" width="2" height="2" fill="black" />
    </svg>

  );
}

export function PixelVolume3Icon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 22H9V20H7V18H9V6H7V4H9V2H11V22ZM19 22H13V20H19V22ZM21 20H19V18H21V20ZM7 18H5V16H7V18ZM17 18H13V16H17V18ZM23 18H21V6H23V18ZM5 10H3V14H5V16H1V8H5V10ZM19 16H17V8H19V16ZM15 14H13V10H15V14ZM7 8H5V6H7V8ZM17 8H13V6H17V8ZM21 6H19V4H21V6ZM19 4H13V2H19V4Z" fill="black" />
    </svg>
  );
}

export function PixelVolume0Icon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 22H15V20H13V18H15V6H13V4H15V2H17V22ZM13 18H11V16H13V18ZM11 8V10H9V14H11V16H7V8H11ZM13 8H11V6H13V8Z" fill="black" />
    </svg>
  );
}

export function PixelBookOpenIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="9" height="2" fill="black" />
      <rect y="19" width="11" height="2" fill="black" />
      <rect x="13" y="3" width="9" height="2" fill="black" />
      <rect x="13" y="19" width="11" height="2" fill="black" />
      <rect x="11" y="5" width="2" height="18" fill="black" />
      <rect y="5" width="2" height="14" fill="black" />
      <rect x="22" y="5" width="2" height="14" fill="black" />
      <rect x="15" y="7" width="5" height="2" fill="black" />
      <rect x="15" y="11" width="5" height="2" fill="black" />
      <rect x="15" y="15" width="2" height="2" fill="black" />
    </svg>
  );
}

export function PixelLockIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="8" width="14" height="2" fill="black" />
      <rect x="5" y="20" width="14" height="2" fill="black" />
      <rect x="3" y="10" width="2" height="10" fill="black" />
      <rect x="19" y="10" width="2" height="10" fill="black" />
      <rect x="7" y="4" width="2" height="4" fill="black" />
      <rect x="9" y="2" width="6" height="2" fill="black" />
      <rect x="15" y="4" width="2" height="4" fill="black" />
    </svg>
  );
}

export function PixelCheckIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 18H8V16H10V18ZM8 16H6V14H8V16ZM12 14V16H10V14H12ZM6 14H4V12H6V14ZM14 14H12V12H14V14ZM16 12H14V10H16V12ZM18 10H16V8H18V10ZM20 8H18V6H20V8Z" fill="black" />
    </svg>
  );
}

export function PixelSearchIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 22H20V20H22V22ZM20 20H18V18H20V20ZM14 18H6V16H14V18ZM18 18H16V16H18V18ZM6 16H4V14H6V16ZM16 16H14V14H16V16ZM4 14H2V6H4V14ZM18 14H16V6H18V14ZM6 6H4V4H6V6ZM16 6H14V4H16V6ZM14 4H6V2H14V4Z" fill="black" />
    </svg>
  );
}

export function PixelPlayIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="11" width="2" height="2" transform="rotate(180 15 11)" fill="black" />
      <rect x="15" y="15" width="2" height="2" transform="rotate(180 15 15)" fill="black" />
      <rect x="13" y="17" width="2" height="2" transform="rotate(180 13 17)" fill="black" />
      <rect x="13" y="9" width="2" height="2" transform="rotate(180 13 9)" fill="black" />
      <rect x="11" y="7" width="2" height="2" transform="rotate(180 11 7)" fill="black" />
      <rect x="9" y="21" width="2" height="18" transform="rotate(180 9 21)" fill="black" />
      <rect width="2" height="2" transform="matrix(1 0 0 -1 15 13)" fill="black" />
      <rect x="9" y="17" width="2" height="2" fill="black" />
    </svg>
  );
}

export function PixelClockIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
      <path d="M12 8V12H16M12 2V4M12 20V22M2 12H4M20 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function PixelHomeIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10V20H9V14H15V20H20V10L12 4L4 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
    </svg>
  );
}

export function PixelRestartIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10H2V6" />
      <path d="M2.5 10C3.5 6 7 3 11.5 3.5C16.5 4 20.5 8 20.5 13C20.5 18 16.5 22 11.5 22C8 22 5 19.5 3.5 16" />
    </svg>
  );
}

export function PixelArrowLeftIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 12H4M10 6L4 12L10 18" />
    </svg>
  );
}

export function PixelSparklesIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="11" y="1" width="2" height="4" fill="currentColor" />
      <rect width="2" height="4" transform="matrix(1 0 0 -1 11 23)" fill="currentColor" />
      <rect x="9" y="5" width="2" height="4" fill="currentColor" />
      <rect width="2" height="4" transform="matrix(1 0 0 -1 9 19)" fill="currentColor" />
      <rect x="13" y="5" width="2" height="4" fill="currentColor" />
      <rect width="2" height="4" transform="matrix(1 0 0 -1 13 19)" fill="currentColor" />
      <rect x="5" y="9" width="4" height="2" fill="currentColor" />
      <rect width="4" height="2" transform="matrix(-1 0 0 1 19 9)" fill="currentColor" />
      <rect x="1" y="11" width="4" height="2" fill="currentColor" />
      <rect width="4" height="2" transform="matrix(-1 0 0 1 23 11)" fill="currentColor" />
      <rect x="5" y="13" width="4" height="2" fill="currentColor" />
      <rect width="4" height="2" transform="matrix(-1 0 0 1 19 13)" fill="currentColor" />
      <rect x="19" y="1" width="2" height="6" fill="currentColor" />
      <rect x="17" y="3" width="6" height="2" fill="currentColor" />
      <rect x="3" y="17" width="2" height="2" fill="currentColor" />
      <rect x="1" y="19" width="2" height="2" fill="currentColor" />
      <rect x="3" y="21" width="2" height="2" fill="currentColor" />
      <rect x="5" y="19" width="2" height="2" fill="currentColor" />
    </svg>
  );
}

export function PixelSkullIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="20" width="2" height="2" fill="currentColor" />
      <rect x="11" y="20" width="2" height="2" fill="currentColor" />
      <rect x="15" y="20" width="2" height="2" fill="currentColor" />
      <rect x="9" y="16" width="2" height="4" fill="currentColor" />
      <rect x="13" y="16" width="2" height="4" fill="currentColor" />
      <rect x="5" y="14" width="2" height="6" fill="currentColor" />
      <rect x="17" y="14" width="2" height="6" fill="currentColor" />
      <rect x="3" y="14" width="4" height="2" fill="currentColor" />
      <rect x="1" y="4" width="2" height="10" fill="currentColor" />
      <rect x="21" y="4" width="2" height="10" fill="currentColor" />
      <rect x="3" y="2" width="18" height="2" fill="currentColor" />
      <rect x="17" y="14" width="4" height="2" fill="currentColor" />
      <rect x="8" y="7" width="2" height="4" fill="currentColor" />
      <rect x="14" y="7" width="2" height="4" fill="currentColor" />
    </svg>
  );
}

export function PixelLightningIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2L4 13H11L10 22L20 11H13L14 2Z" fill="#fbbf24" stroke="none" />
    </svg>
  );
}

export function PixelFireIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="2" height="4" fill="#fc7e2f" />
      <rect x="7" y="6" width="2" height="2" fill="#fc7e2f" />
      <rect x="5" y="8" width="2" height="2" fill="#fc7e2f" />
      <rect x="13" y="10" width="2" height="2" fill="#fc7e2f" />
      <rect x="15" y="8" width="2" height="2" fill="#fc7e2f" />
      <rect x="17" y="10" width="2" height="2" fill="#fc7e2f" />
      <rect x="19" y="12" width="2" height="6" fill="#fc7e2f" />
      <rect x="3" y="10" width="2" height="8" fill="#fc7e2f" />
      <rect x="11" y="6" width="2" height="4" fill="#fc7e2f" />
      <rect x="17" y="18" width="2" height="2" fill="#fc7e2f" />
      <rect x="7" y="20" width="10" height="2" fill="#fc7e2f" />
      <rect x="5" y="18" width="2" height="2" fill="#fc7e2f" />
      <rect x="9" y="16" width="6" height="4" fill="#fcfc2f" />
      <rect x="11" y="14" width="2" height="3" fill="#fcfc2f" />
    </svg>
  );
}

export function PixelMagicOrbIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="2" width="12" height="2" fill="currentColor" />
      <rect x="6" y="20" width="12" height="2" fill="currentColor" />
      <rect x="4" y="4" width="2" height="2" fill="currentColor" />
      <rect width="2" height="2" transform="matrix(-1 0 0 1 20 4)" fill="currentColor" />
      <rect x="2" y="6" width="2" height="12" fill="currentColor" />
      <rect width="2" height="12" transform="matrix(-1 0 0 1 22 6)" fill="currentColor" />
      <rect x="4" y="18" width="2" height="2" fill="currentColor" />
      <rect width="2" height="2" transform="matrix(-1 0 0 1 20 18)" fill="currentColor" />
      <rect x="11" y="7" width="2" height="2" fill="currentColor" />
      <rect x="11" y="15" width="2" height="2" fill="currentColor" />
      <rect x="7" y="11" width="2" height="2" fill="currentColor" />
      <rect x="15" y="11" width="2" height="2" fill="currentColor" />
      <rect x="9" y="9" width="2" height="2" fill="currentColor" />
      <rect x="13" y="9" width="2" height="2" fill="currentColor" />
      <rect x="13" y="13" width="2" height="2" fill="currentColor" />
      <rect x="9" y="13" width="2" height="2" fill="currentColor" />
    </svg>

  );
}

export function PixelMoonIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 22H8V20H18V22ZM8 20H6V18H8V20ZM20 20H18V18H20V20ZM6 18H4V16H6V18ZM22 18H20V14H18V12H20V10H22V18ZM4 16H2V6H4V16ZM18 16H12V14H18V16ZM12 14H10V12H12V14ZM10 12H8V6H10V12ZM6 6H4V4H6V6ZM14 4H12V6H10V4H6V2H14V4Z" fill="currentColor" />
    </svg>
  );
}

export function PixelHoleIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="16" rx="8" ry="4" stroke="#7f1d1d" strokeWidth="2" fill="#ef4444" fillOpacity="0.8" />
    </svg>
  );
}

export function PixelTargetIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="square" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 2V6M12 18V22M2 12H6M18 12H22" />
    </svg>
  );
}
export function PixelEditIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="2" width="4" height="2" fill="currentColor" />
      <rect x="18" y="4" width="2" height="2" fill="currentColor" />
      <rect x="16" y="6" width="2" height="2" fill="currentColor" />
      <rect x="14" y="8" width="2" height="2" fill="currentColor" />
      <rect x="12" y="10" width="2" height="2" fill="currentColor" />
      <rect x="10" y="12" width="2" height="2" fill="currentColor" />
      <rect x="8" y="14" width="2" height="2" fill="currentColor" />
      <rect x="6" y="16" width="2" height="2" fill="currentColor" />
      <rect x="4" y="18" width="2" height="2" fill="currentColor" />
      <rect x="2" y="16" width="2" height="4" fill="currentColor" />
      <rect x="4" y="14" width="2" height="2" fill="currentColor" />
      <rect x="6" y="12" width="2" height="2" fill="currentColor" />
      <rect x="8" y="10" width="2" height="2" fill="currentColor" />
      <rect x="10" y="8" width="2" height="2" fill="currentColor" />
      <rect x="12" y="6" width="2" height="2" fill="currentColor" />
      <rect x="14" y="4" width="2" height="2" fill="currentColor" />
      <rect x="14" y="6" width="2" height="2" fill="currentColor" />
      <rect x="16" y="4" width="2" height="2" fill="currentColor" />
      <rect x="16" y="12" width="2" height="2" fill="currentColor" />
      <rect x="16" y="20" width="2" height="2" fill="currentColor" />
      <rect x="12" y="16" width="2" height="2" fill="currentColor" />
      <rect x="20" y="16" width="2" height="2" fill="currentColor" />
      <rect x="14" y="14" width="2" height="2" fill="currentColor" />
      <rect x="18" y="14" width="2" height="2" fill="currentColor" />
      <rect x="18" y="18" width="2" height="2" fill="currentColor" />
      <rect x="14" y="18" width="2" height="2" fill="currentColor" />
      <rect x="4" y="2" width="2" height="2" fill="currentColor" />
      <rect x="2" y="4" width="2" height="2" fill="currentColor" />
      <rect x="4" y="6" width="2" height="2" fill="currentColor" />
      <rect x="6" y="4" width="2" height="2" fill="currentColor" />
      <rect x="20" y="10" width="2" height="2" fill="currentColor" />
      <rect x="8" y="20" width="2" height="2" fill="currentColor" />
    </svg>

  );
}

export function PixelSaveIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="2" fill="currentColor" />
      <rect x="3" y="5" width="2" height="14" fill="currentColor" />
      <rect x="19" y="5" width="2" height="14" fill="currentColor" />
      <rect x="5" y="19" width="14" height="2" fill="currentColor" />
      <rect x="7" y="5" width="4" height="6" fill="currentColor" />
      <rect x="9" y="13" width="6" height="6" fill="currentColor" />
    </svg>
  );
}
