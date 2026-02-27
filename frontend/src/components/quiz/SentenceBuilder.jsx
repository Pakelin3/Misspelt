import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// --- SUB-COMPONENTE: LA PALABRA INDIVIDUAL ---
const SortableWord = ({ id, text, isChecked, isCorrect }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto', // Que se vea por encima al arrastrar
    };

    // Estilos condicionales según el estado del juego
    let bgClass = 'bg-background border-primary text-foreground hover:bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]';
    if (isChecked) {
        bgClass = isCorrect
            ? 'bg-green-500 border-green-700 text-white shadow-none translate-y-[2px]'
            : 'bg-destructive border-red-800 text-white shadow-none translate-y-[2px]';
    }
    if (isDragging) {
        bgClass = 'bg-primary/20 border-primary border-dashed opacity-80 shadow-[4px_4px_0px_0px_rgba(var(--primary),0.5)] scale-105';
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        flex items-center gap-2 px-5 py-3 border-4 font-pixel uppercase font-bold text-sm md:text-base pixel-border
        cursor-grab active:cursor-grabbing select-none touch-none
        transition-all duration-200 ${bgClass}
      `}
        >
            <GripVertical size={20} className="opacity-40" strokeWidth={3} />
            {text}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const SentenceBuilder = ({ word, onSuccess, onError }) => {
    const [items, setItems] = useState([]);
    const [targetSentence, setTargetSentence] = useState("");
    const [translation, setTranslation] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    // Configuración de sensores (Mouse, Touch y Teclado para accesibilidad)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (word.examples && word.examples.length > 0) {
            let example = word.examples[0];
            if (typeof example === 'string') example = { en: example, es: "Traduce esto" };

            setTargetSentence(example.en);
            setTranslation(example.es);

            // Creamos objetos con ID único para dnd-kit
            const wordsArray = example.en.split(' ').map((w, i) => ({
                id: `word-${i}-${w}`, // ID compuesto para evitar duplicados si hay palabras repetidas
                text: w
            }));

            // Mezclar (Fisher-Yates)
            for (let i = wordsArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [wordsArray[i], wordsArray[j]] = [wordsArray[j], wordsArray[i]];
            }

            setItems(wordsArray);
            setIsChecked(false);
            setIsCorrect(false);
        }
    }, [word]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const checkAnswer = () => {
        const currentSentence = items.map(i => i.text).join(' ');
        const cleanCurrent = currentSentence.replace(/[.,!?;:]/g, '').toLowerCase().trim();
        const cleanTarget = targetSentence.replace(/[.,!?;:]/g, '').toLowerCase().trim();

        setIsChecked(true);
        if (cleanCurrent === cleanTarget) {
            setIsCorrect(true);
            setTimeout(onSuccess, 1500);
        } else {
            setIsCorrect(false);
            setTimeout(() => {
                setIsChecked(false);
                onError();
            }, 1500);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full max-w-4xl">
            <div className="text-center space-y-4 bg-muted p-6 border-4 border-primary pixel-border w-full md:w-auto shadow-[4px_4px_0px_0px_rgba(var(--primary),0.3)]">
                <h3 className="text-lg font-pixel text-primary uppercase tracking-widest">Ordena la Frase</h3>
                <p className="text-2xl md:text-3xl font-bold text-foreground font-sans tracking-wide">"{translation}"</p>
                <div className="inline-block bg-background px-4 py-2 border-2 border-dashed border-primary mt-2">
                    <p className="text-sm font-pixel text-muted-foreground uppercase">
                        Usa la palabra:<br /><span className="text-xl text-primary font-black block mt-1">{word.text}</span>
                    </p>
                </div>
            </div>

            {/* ÁREA DE JUEGO DND-KIT */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-wrap gap-4 justify-center p-8 bg-background min-h-[140px] w-full border-4 border-primary pixel-border shadow-inner">
                    <SortableContext
                        items={items}
                        strategy={horizontalListSortingStrategy}
                    >
                        {items.map((item) => (
                            <SortableWord
                                key={item.id}
                                id={item.id}
                                text={item.text}
                                isChecked={isChecked}
                                isCorrect={isCorrect}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>

            <div className="h-16 flex items-center justify-center w-full mt-4">
                {!isChecked ? (
                    <button
                        onClick={checkAnswer}
                        className="px-10 py-4 font-black bg-accent text-xl uppercase pixel-btn w-full md:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all"
                    >
                        COMPROBAR
                    </button>
                ) : (
                    <div className={`text-2xl font-pixel animate-bounce ${isCorrect ? 'text-green-500' : 'text-destructive'}`}>
                        {isCorrect ? '✅ ¡EXCELENTE!' : '❌ INCORRECTO'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SentenceBuilder;