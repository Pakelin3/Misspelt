import React from "react";
import { Link } from "react-router-dom";
import { StarIcon, SwordIcon } from "@/components/PixelIcons";
import heroBg from "@/img/background.jpg";
import TextShuffle from "@/components/ui/TextShuffle";

export function HeroSection() {
  const [stats, setStats] = React.useState(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL_API}/landing-stats/`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching landing stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-20 bg-background">

      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Pixel Art Landscape"
          className="w-full h-full object-cover pixel-rendering opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">

        <div className="flex justify-center gap-4 mb-6">
          <StarIcon className="w-8 h-8 animate-sparkle text-accent" />
          <StarIcon className="w-6 h-6 animate-sparkle stagger-1 text-accent" />
          <StarIcon className="w-8 h-8 animate-sparkle stagger-2 text-accent" />
        </div>

        <h1 className="font-mono  text-foreground leading-tight mb-6 animate-slide-up">
          <TextShuffle
            text="MISSPELT"
            shuffleDirection="up"
            duration={1}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="back.out(1.1)"
            stagger={0.2}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover
            respectReducedMotion={true}
            loop
            loopDelay={1}
          />
        </h1>

        <p className="font-sans text-3xl md:text-3xl lg:text-4xl text-foreground max-w-2xl mx-auto leading-relaxed mb-4 animate-slide-up stagger-1">
          Cultiva tu inglés mientras juegas
        </p>

        <p className="font-sans text-2xl text-muted-foreground max-w-lg mx-auto leading-relaxed mb-10 animate-slide-up stagger-2">
          Un juego RPG educativo donde cada palabra aprendida hace crecer tu granja.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('start-game-loading'))}
            className="flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 font-mono text-sm pixel-border-primary pixel-btn hover:text-primary-foreground"
          >
            <SwordIcon className="w-5 h-5" />
            COMENZAR AVENTURA
          </button>
          <a
            href="#quiz-preview"
            className="flex items-center gap-3 bg-card text-foreground px-8 py-4 font-mono text-sm pixel-border pixel-btn no-underline"
          >
            VER DEMO
          </a>
        </div>

        {/* Estadísticas */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-80">
          <StatItem label="Phrasal Verbs" targetValue={stats?.phrasal_verbs} />
          <div className="h-8 w-1 bg-border hidden sm:block" />
          <StatItem label="Slangs" targetValue={stats?.slangs} />
          <div className="h-8 w-1 bg-border hidden sm:block" />
          <StatItem label="Idioms" targetValue={stats?.idioms} />
          <div className="h-8 w-1 bg-border hidden sm:block" />
          <StatItem label="Insignias" targetValue={stats?.badges} />
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, targetValue }) {
  const [currentValue, setCurrentValue] = React.useState("0");
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible || targetValue == null) return;

    const roundedValue = Math.round(targetValue / 10) * 10;
    if (roundedValue === 0) {
      setCurrentValue("0");
      return;
    }

    const duration = 1500; // ms
    const startTime = Date.now();
    const digits = roundedValue.toString().length;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        const randomNum = Math.floor(Math.random() * Math.pow(10, digits));
        setCurrentValue(randomNum.toString().padStart(digits, '0'));
      } else {
        setCurrentValue(roundedValue.toString());
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [targetValue, isVisible]);

  return (
    <div ref={ref} className="flex flex-col items-center min-w-[140px]">
      <span className="font-mono text-xl md:text-2xl text-accent mb-1 min-h-[32px] flex items-center justify-center">
        {targetValue != null ? `+${currentValue}` : "---"}
      </span>
      <span className="font-sans text-lg text-muted-foreground uppercase">{label}</span>
    </div>
  );
}