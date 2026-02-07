import React from "react";
import { Link } from "react-router-dom";
import { StarIcon, SwordIcon } from "@/components/PixelIcons";

// 1. IMPORTAR LA IMAGEN
// Asegúrate de que la ruta sea correcta. Si usas el alias '@', esto apunta a 'src'
import heroBg from "@/img/background.png"; 

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-20 bg-background">
      
      {/* 2. FONDO DE IMAGEN (Adaptado al estilo original) */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Pixel Art Landscape"
          // Clases clave:
          // w-full h-full object-cover -> Para que cubra todo el fondo sin deformarse
          // pixel-rendering -> Para que no se vea borrosa sino pixelada
          // opacity-30 -> Para que sea sutil y deje leer el texto
          className="w-full h-full object-cover pixel-rendering opacity-30"
        />
        {/* Degradado para suavizar la transición hacia el color de fondo (Igual que en Next.js) */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        
        {/* Estrellas decorativas */}
        <div className="flex justify-center gap-4 mb-6">
          <StarIcon className="w-8 h-8 animate-sparkle text-accent" />
          <StarIcon className="w-6 h-6 animate-sparkle stagger-1 text-accent" />
          <StarIcon className="w-8 h-8 animate-sparkle stagger-2 text-accent" />
        </div>

        {/* Título Principal */}
        <h1 className="font-mono text-3xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-6 animate-slide-up">
          WORD FARM
        </h1>

        <p className="font-sans text-2xl md:text-3xl lg:text-4xl text-foreground max-w-2xl mx-auto leading-relaxed mb-4 animate-slide-up stagger-1">
          Cultiva tu inglés mientras juegas
        </p>

        <p className="font-sans text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10 animate-slide-up stagger-2">
          Un juego RPG educativo donde cada palabra aprendida hace crecer tu granja.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
          <Link
            to="/login"
            className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 font-mono text-sm pixel-border-primary pixel-btn no-underline hover:text-primary-foreground"
          >
            <SwordIcon className="w-5 h-5" />
            COMENZAR AVENTURA
          </Link>
          <a
            href="#como-funciona"
            className="flex items-center gap-3 bg-card text-foreground px-8 py-4 font-mono text-sm pixel-border pixel-btn no-underline"
          >
            VER DEMO
          </a>
        </div>

        {/* Estadísticas */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-80">
          <StatItem label="Phrasal Verbs" value="200+" />
          <div className="h-8 w-1 bg-border hidden sm:block" />
          <StatItem label="Slangs" value="150+" />
          <div className="h-8 w-1 bg-border hidden sm:block" />
          <StatItem label="Niveles" value="12" />
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-xl md:text-2xl text-accent mb-1">{value}</span>
      <span className="font-sans text-lg text-muted-foreground uppercase">{label}</span>
    </div>
  );
}