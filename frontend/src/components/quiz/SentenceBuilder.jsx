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
    let bgClass = 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50';
    if (isChecked) {
        bgClass = isCorrect
            ? 'bg-green-500 border-green-700 text-white'
            : 'bg-red-500 border-red-700 text-white';
    }
    if (isDragging) {
        bgClass = 'bg-primary/20 border-primary border-dashed opacity-50';
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
        flex items-center gap-2 px-4 py-3 rounded-lg border-b-4 font-bold 
        cursor-grab active:cursor-grabbing select-none touch-none
        transition-colors duration-200 ${bgClass}
      `}
        >
            <GripVertical size={16} className="opacity-30" />
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
        <div className="flex flex-col items-center space-y-8 w-full max-w-3xl">
            <div className="text-center space-y-3">
                <h3 className="text-lg font-pixel text-muted-foreground uppercase tracking-widest">Ordena la Frase</h3>
                <p className="text-2xl md:text-3xl font-bold text-foreground">"{translation}"</p>
                <p className="text-sm text-gray-500 italic">
                    Usa la palabra: <span className="font-bold text-primary">{word.text}</span>
                </p>
            </div>

            {/* ÁREA DE JUEGO DND-KIT */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-wrap gap-3 justify-center p-6 bg-secondary/30 rounded-xl min-h-[120px] w-full border-2 border-dashed border-secondary">
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

            <div className="h-16 flex items-center justify-center">
                {!isChecked ? (
                    <button
                        onClick={checkAnswer}
                        className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-bold text-lg border-b-4 border-green-900 hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all shadow-xl"
                    >
                        COMPROBAR
                    </button>
                ) : (
                    <div className={`text-2xl font-bold animate-bounce ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✨ ¡EXCELENTE! ✨' : '❌ INTÉNTALO DE NUEVO'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SentenceBuilder;