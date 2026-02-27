import { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const MultiChoice = ({ word, distractors = [], onSuccess, onError }) => {
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isChecked, setIsChecked] = useState(false);

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

        setOptions(allOptions);
        setSelectedOption(null);
        setIsChecked(false);
    }, [word, distractors]);

    const handleSelect = (option) => {
        if (isChecked) return;
        setSelectedOption(option);

        checkAnswer(option);
    };

    const checkAnswer = (option) => {
        setIsChecked(true);
        if (option.isCorrect) {
            setTimeout(onSuccess, 1000);
        } else {
            setTimeout(() => {
                onError();
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full max-w-3xl">
            <div className="text-center space-y-4 bg-muted p-6 border-4 border-primary pixel-border w-full shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)]">
                <HelpCircle size={48} className="mx-auto text-primary mb-2" strokeWidth={2.5} />
                <h3 className="text-lg font-pixel text-primary uppercase tracking-widest">¿Cuál es la palabra?</h3>

                <p className="text-xl md:text-2xl font-bold text-foreground font-sans leading-relaxed">
                    "{word.definition || word.translation}"
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                {options.map((option) => {
                    let btnClass = "bg-background border-primary text-foreground hover:bg-muted";

                    if (isChecked) {
                        if (option.isCorrect) {
                            btnClass = "bg-green-500 border-green-700 text-white shadow-none translate-y-[4px]";
                        } else if (selectedOption?.id === option.id && !option.isCorrect) {
                            btnClass = "bg-destructive border-red-800 text-white shadow-none translate-y-[4px]";
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
                                relative p-5 border-4 font-black text-xl font-pixel uppercase transition-all flex justify-center items-center
                                ${!isChecked && "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none"}
                                ${btnClass}
                            `}
                        >
                            <span>{option.text}</span>

                            {isChecked && option.isCorrect && (
                                <CheckCircle className="absolute top-2 right-2 w-6 h-6 text-white drop-shadow-sm" strokeWidth={3} />
                            )}
                            {isChecked && selectedOption?.id === option.id && !option.isCorrect && (
                                <XCircle className="absolute top-2 right-2 w-6 h-6 text-white drop-shadow-sm" strokeWidth={3} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MultiChoice;