import { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const MultiChoice = ({ word, distractors = [], onSuccess, onError }) => {
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        // 1. Preparamos la respuesta correcta
        const correctOption = {
            id: word.id,
            text: word.text,
            isCorrect: true
        };

        // 2. Preparamos las incorrectas (tomamos 3 al azar de los distractores)
        const wrongOptions = distractors
            .sort(() => 0.5 - Math.random()) // Mezclar distractores
            .slice(0, 3) // Tomar solo 3
            .map(w => ({
                id: w.id,
                text: w.text,
                isCorrect: false
            }));

        // 3. Unimos y mezclamos todo para que la correcta no esté siempre en el mismo lugar
        const allOptions = [correctOption, ...wrongOptions]
            .sort(() => 0.5 - Math.random());

        setOptions(allOptions);
        setSelectedOption(null);
        setIsChecked(false);
    }, [word, distractors]);

    const handleSelect = (option) => {
        if (isChecked) return; // Bloquear si ya contestó
        setSelectedOption(option);

        // Comprobar automáticamente al hacer clic (más rápido) o esperar botón
        checkAnswer(option);
    };

    const checkAnswer = (option) => {
        setIsChecked(true);
        if (option.isCorrect) {
            setIsCorrect(true);
            setTimeout(onSuccess, 1000);
        } else {
            setIsCorrect(false);
            setTimeout(() => {
                // Opcional: Dar oportunidad de intentar de nuevo o pasar error directo
                onError();
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full max-w-lg">
            <div className="text-center space-y-4 bg-white/50 p-6 rounded-xl border-2 border-dashed border-gray-300 w-full">
                <HelpCircle size={40} className="mx-auto text-primary mb-2" />
                <h3 className="text-lg font-pixel text-muted-foreground uppercase">¿Cuál es esta palabra?</h3>

                {/* Mostramos la DEFINICIÓN si existe, si no la TRADUCCIÓN */}
                <p className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                    "{word.definition || word.translation}"
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {options.map((option) => {
                    // Lógica de colores para el feedback
                    let btnClass = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";

                    if (isChecked) {
                        if (option.isCorrect) {
                            btnClass = "bg-green-500 border-green-700 text-white"; // Correcta (siempre se muestra verde al final)
                        } else if (selectedOption?.id === option.id && !option.isCorrect) {
                            btnClass = "bg-red-500 border-red-700 text-white"; // Incorrecta seleccionada
                        } else {
                            btnClass = "opacity-50 bg-gray-100 border-gray-200"; // Las demás se apagan
                        }
                    }

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleSelect(option)}
                            disabled={isChecked}
                            className={`
                relative p-4 rounded-xl border-b-4 font-bold text-lg transition-all
                active:border-b-0 active:translate-y-1
                ${btnClass}
              `}
                        >
                            {option.text}

                            {/* Iconos de feedback */}
                            {isChecked && option.isCorrect && (
                                <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-white/80" />
                            )}
                            {isChecked && selectedOption?.id === option.id && !option.isCorrect && (
                                <XCircle className="absolute top-2 right-2 w-5 h-5 text-white/80" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MultiChoice;