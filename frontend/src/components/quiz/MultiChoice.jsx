import { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const MultiChoice = ({ word, distractors = [], onSuccess, onError }) => {
    const [{ options, selectedOption, isChecked }, setState] = useState({
        options: [],
        selectedOption: null,
        isChecked: false
    });

    useEffect(() => {
        const correctOption = {
            id: word.id,
            text: word.text,
            isCorrect: true
        };

        const wrongOptions = distractors
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(w => ({
                id: w.id,
                text: w.text,
                isCorrect: false
            }));

        const allOptions = [correctOption, ...wrongOptions]
            .sort(() => 0.5 - Math.random());

        setState({
            options: allOptions,
            selectedOption: null,
            isChecked: false
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [word.id]);

    const correctOption = options.find((o) => o.isCorrect);
    const meaningHint = word.translation || word.definition;

    const handleSelect = (option) => {
        if (isChecked) return;
        setState(prev => ({ ...prev, selectedOption: option, isChecked: true }));

        if (option.isCorrect) {
            setTimeout(onSuccess, 1000);
        } else {
            // Un fallo debe enseñar: se mantiene la revelación en pantalla el
            // tiempo suficiente para leerla antes de reintentar.
            setTimeout(() => {
                setState(prev => ({ ...prev, selectedOption: null, isChecked: false }));
                onError();
            }, 2600);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full">
            <div className="text-center space-y-4 bg-muted p-6 border-4 border-primary pixel-border w-full shadow-pixel-md-primary">
                <HelpCircle size={48} className="mx-auto text-primary mb-2" strokeWidth={2.5} aria-hidden="true" />
                <h3 className="text-lg font-mono text-primary uppercase tracking-widest">¿Cuál es la palabra?</h3>

                <p className="text-xl md:text-2xl font-bold text-foreground font-sans leading-relaxed">
                    "{word.definition || word.translation}"
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                {options.map((option) => {
                    let btnClass = "bg-background border-primary text-foreground hover:bg-muted";

                    if (isChecked) {
                        if (option.isCorrect) {
                            // La opción correcta siempre se revela, se haya elegido o no:
                            // es el momento de aprenderla.
                            btnClass = "bg-success border-success text-success-foreground shadow-none translate-y-[4px]";
                        } else if (selectedOption?.id === option.id) {
                            btnClass = "bg-destructive border-destructive text-destructive-foreground shadow-none translate-y-[4px]";
                        } else {
                            btnClass = "opacity-50 bg-muted border-muted-foreground text-muted-foreground shadow-none translate-y-[4px]";
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option)}
                            disabled={isChecked}
                            className={`
                                relative p-5 border-4 font-black text-xl font-mono uppercase transition-all flex justify-center items-center
                                ${!isChecked && "shadow-pixel-md hover:translate-y-[2px] hover:shadow-pixel-sm active:translate-y-[4px] active:shadow-none"}
                                ${btnClass}
                            `}
                        >
                            <span lang="en">{option.text}</span>

                            {isChecked && option.isCorrect && (
                                <CheckCircle aria-hidden="true" className="absolute top-2 right-2 w-6 h-6 text-success-foreground drop-shadow-sm" strokeWidth={3} />
                            )}
                            {isChecked && !option.isCorrect && selectedOption?.id === option.id && (
                                <XCircle aria-hidden="true" className="absolute top-2 right-2 w-6 h-6 text-destructive-foreground drop-shadow-sm" strokeWidth={3} />
                            )}
                        </button>
                    );
                })}
            </div>

            <div role="status" aria-live="polite" className="min-h-16 flex items-center justify-center text-center">
                {isChecked && selectedOption?.isCorrect && (
                    <p className="text-success font-sans text-lg">¡Correcto!</p>
                )}
                {isChecked && selectedOption && !selectedOption.isCorrect && (
                    <p className="text-destructive font-sans text-lg">
                        Incorrecto. La palabra correcta era <strong lang="en">{correctOption?.text}</strong>
                        {meaningHint ? <> — «{meaningHint}»</> : null}.
                    </p>
                )}
            </div>
        </div>
    );
};

export default MultiChoice;