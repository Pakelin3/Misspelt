import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuizManager from "@/components/quiz/QuizManager";
import { Swords, Activity } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/Button";

export function QuizPreview() {
  const [cooldown, setCooldown] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [words, setWords] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedTime = localStorage.getItem("demoCooldown");
    if (storedTime) {
      const timePassed = Date.now() - parseInt(storedTime, 10);
      const oneHour = 60 * 60 * 1000;
      if (timePassed < oneHour) {
        setCooldown(true);
      } else {
        localStorage.removeItem("demoCooldown");
      }
    }
  }, []);

  const startGame = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL_API}/game/quiz-words/`);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setWords(data);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error fetching demo words:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLose = () => {
    localStorage.setItem("demoCooldown", Date.now().toString());
    setCooldown(true);
    setIsPlaying(false);
  };

  const handleWin = () => {
    setHasWon(true);
    setIsPlaying(false);
  };

  const handleClose = () => {
    setIsPlaying(false);
  }

  return (
    <section id="quiz-preview" className="py-24 border-y-4 border-muted bg-card/30">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-around text-center mb-12">
          <h2 className="font-mono text-2xl md:text-4xl text-foreground">PRUEBA UN QUIZ</h2>
          <span className="font-mono text-xs text-accent-strong bg-accent/10 px-3 py-1 mb-4 inline-block pixel-border-accent">DEMO JUGABLE</span>
        </div>

        {cooldown ? (
          <div className="bg-card pixel-border p-8 md:p-12 text-center shadow-pixel-xl max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🛑</div>
            <h3 className="font-mono text-2xl md:text-3xl text-destructive mb-4 break-words min-w-0">¡Oops! Se te acabó la demo</h3>
            <p className="font-sans text-lg text-muted-foreground mb-8">
              Has perdido tu única vida en la versión de prueba. Si quieres seguir practicando y mejorando tu vocabulario, ¡tienes opciones completas esperándote!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="destructive"
                onClick={() => navigate('/play')}
                className="flex-1"
              >
                <Swords size={20} aria-hidden="true" />
                SUPERVIVENCIA
              </Button>
              <Button
                onClick={() => navigate('/quiz')}
                className="flex-1"
              >
                <Activity size={20} aria-hidden="true" />
                Nueva práctica
              </Button>
            </div>
          </div>
        ) : hasWon ? (
          <div className="bg-card pixel-border p-8 md:p-12 text-center shadow-pixel-xl max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🏆</div>
            <h3 className="font-mono text-2xl md:text-3xl text-primary mb-4 break-words">¡Felicidades! Has completado la demo</h3>
            <p className="font-sans text-lg text-muted-foreground mb-8">
              ¡Excelente trabajo superando este desafío de 10 palabras sin perder tu única vida! Si quieres seguir poniendo a prueba tu vocabulario, ¡descubre el resto del juego!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="destructive"
                onClick={() => navigate('/play')}
                className="flex-1"
              >
                <Swords size={20} aria-hidden="true" />
                SUPERVIVENCIA
              </Button>
              <Button
                onClick={() => navigate('/quiz')}
                className="flex-1"
              >
                <Activity size={20} aria-hidden="true" />
                Nueva práctica
              </Button>
            </div>
          </div>
        ) : isPlaying ? (
          <div className="animate-in zoom-in-95 duration-500">
            <QuizManager
              words={words}
              allWords={words}
              initialLives={1}
              onLose={handleLose}
              onComplete={handleWin}
              onClose={handleClose}
              mode="practice"
            />
          </div>
        ) : (
          <div className="bg-card pixel-border p-8 md:p-12 text-center shadow-pixel-xl max-w-2xl mx-auto">
            <h3 className="font-mono text-2xl md:text-3xl text-foreground mb-4 break-words">¿Te atreves a probar?</h3>
            <p className="font-sans text-lg text-muted-foreground mb-8">
              Juega una pequeña demostración de nuestros minijuegos integrados con 10 palabras aleatorias.
              Pero ten cuidado: <strong className="text-destructive font-bold inline-block px-1 bg-destructive/10">Solo tienes 1 vida</strong>.
              Si fallas, tendrás que esperar 1 hora para volver a intentarlo en la demo.
            </p>
            <Button
              onClick={startGame}
              disabled={isLoading}
              className="w-full sm:w-auto px-10 py-4 text-xl md:text-xl font-bold animate-pulse"
            >
              {isLoading ? "CARGANDO..." : "INICIAR DEMO"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}