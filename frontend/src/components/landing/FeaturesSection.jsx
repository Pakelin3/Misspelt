import React from "react";
import { BookIcon, BrainIcon, TrophyIcon, HeartIcon } from "@/components/PixelIcons";

const features = [
  {
    icon: BookIcon,
    title: "DICCIONARIO VIVO",
    description: "Colecciona palabras como si fueran cultivos. Cada una tiene su propia ficha con ejemplos y audio.",
  },
  {
    icon: BrainIcon,
    title: "IA ADAPTATIVA",
    description: "El juego aprende de ti. Si fallas, te ayuda. Si aciertas, te reta con enemigos más fuertes.",
  },
  {
    icon: TrophyIcon,
    title: "INSIGNIAS",
    description: "Desbloquea logros por rachas diarias y dominio de temas específicos.",
  },
  {
    icon: HeartIcon,
    title: "SISTEMA DE VIDAS",
    description: "Cuidado con los errores. Tienes 5 corazones diarios para mantener tu granja a salvo.",
  },
];

export function FeaturesSection() {
  return (
    <section id="como-funciona" className="py-20 bg-card/30 border-y-4 border-muted">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-mono text-2xl md:text-3xl text-foreground mb-4">
            MECÁNICAS DE JUEGO
          </h2>
          <div className="h-1 w-24 bg-primary mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-background p-6 pixel-border group hover:translate-y-[-4px] transition-transform duration-300">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-primary/10 rounded-sm pixel-border-primary shrink-0">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-mono text-sm text-foreground mb-2">{feature.title}</h3>
                  <p className="font-sans text-xl text-muted-foreground leading-snug">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}