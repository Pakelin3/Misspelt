import React, { useState } from "react";
import { HeartIcon, StarIcon } from "@/components/PixelIcons";

const demoQuestion = {
  sentence: 'I need to ___ early tomorrow for my flight.',
  options: [
    { id: "a", text: "get up", correct: true },
    { id: "b", text: "get on", correct: false },
    { id: "c", text: "get off", correct: false },
    { id: "d", text: "get in", correct: false },
  ],
  translation: '"Get up" significa levantarse / despertarse.',
};

export function QuizPreview() {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const isCorrect = selected === "a";

  const handleCheck = () => {
    if (selected) setAnswered(true);
  };

  const handleReset = () => {
    setSelected(null);
    setAnswered(false);
  };

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <span className="font-mono text-xs text-accent bg-accent/10 px-3 py-1 mb-4 inline-block pixel-border-accent">DEMO JUGABLE</span>
          <h2 className="font-mono text-2xl md:text-3xl text-foreground">PRUEBA UNA BATALLA</h2>
        </div>

        <div className="bg-card pixel-border p-6 md:p-10 relative">
          {/* Barra de estado simulada */}
          <div className="flex justify-between items-center mb-8 border-b-2 border-muted pb-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <HeartIcon key={i} className={`w-6 h-6 ${i > (answered && !isCorrect ? 4 : 5) ? 'text-muted' : 'text-destructive'}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-accent" />
              <span className="font-mono text-xs">LVL 1</span>
            </div>
          </div>

          {/* Pregunta */}
          <p className="font-sans text-2xl text-center mb-8">
            Completa la frase: <br/>
            <span className="bg-muted/30 px-2 font-mono text-lg mt-2 inline-block">"{demoQuestion.sentence}"</span>
          </p>

          {/* Opciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {demoQuestion.options.map((option) => {
              let btnClass = "bg-background border-2 border-foreground hover:bg-muted";
              if (answered) {
                if (option.correct) btnClass = "bg-primary text-primary-foreground border-primary";
                else if (selected === option.id) btnClass = "bg-destructive text-destructive-foreground border-destructive";
              } else if (selected === option.id) {
                btnClass = "bg-accent/20 border-accent";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => !answered && setSelected(option.id)}
                  disabled={answered}
                  className={`p-4 text-left font-sans text-xl transition-all ${btnClass}`}
                >
                  <span className="font-mono text-xs mr-2 opacity-50">{option.id.toUpperCase()})</span>
                  {option.text}
                </button>
              );
            })}
          </div>

          {/* Botón de Acción */}
          {!answered ? (
            <button
              onClick={handleCheck}
              disabled={!selected}
              className={`w-full py-4 font-mono text-sm uppercase pixel-btn ${selected ? 'bg-primary text-primary-foreground pixel-border-primary' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
            >
              Comprobar Respuesta
            </button>
          ) : (
            <div className="text-center animate-slide-up">
              <p className={`font-mono text-sm mb-4 ${isCorrect ? 'text-primary' : 'text-destructive'}`}>
                {isCorrect ? '¡CORRECTO! +10 XP' : '¡FALLASTE! -1 VIDA'}
              </p>
              <button onClick={handleReset} className="px-8 py-3 bg-accent text-accent-foreground font-mono text-xs pixel-border-accent pixel-btn">
                INTENTAR DE NUEVO
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}