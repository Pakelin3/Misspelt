import React, { useEffect } from 'react';
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

const SortableWord = ({ id, text, position, total, isChecked, isCorrect }) => {
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
        zIndex: isDragging ? 50 : 'auto',
    };

    let bgClass = 'bg-background border-primary text-foreground hover:bg-muted shadow-pixel-sm';
    if (isChecked) {
        bgClass = isCorrect
            ? 'bg-success border-success text-success-foreground shadow-none translate-y-[2px]'
            : 'bg-destructive border-destructive text-destructive-foreground shadow-none translate-y-[2px]';
    }
    if (isDragging) {
        bgClass = 'bg-primary/20 border-primary border-dashed opacity-80 shadow-pixel-md-primary scale-105';
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            aria-roledescription="palabra arrastrable"
            aria-label={`${text}, posición ${position} de ${total}`}
            className={`
        flex items-center gap-2 px-5 py-3 border-4 font-mono uppercase font-bold text-sm md:text-base pixel-border
        cursor-grab active:cursor-grabbing select-none touch-none
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
        transition-all duration-200 ${bgClass}
    `}
        >
            <GripVertical size={20} className="opacity-40" strokeWidth={3} aria-hidden="true" />
            <span lang="en">{text}</span>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const SentenceBuilder = ({ word, direction = 'en', onSuccess, onError }) => {
    const [state, dispatch] = React.useReducer((s, a) => ({ ...s, ...a }), {
        items: [],
        correctItems: [],
        targetSentence: "",
        translation: "",
        isChecked: false,
        isCorrect: false,
    });
    const { items, correctItems, targetSentence, translation, isChecked, isCorrect } = state;

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

            const isEnglishTarget = direction === 'en' || example.es === "Traduce esto";
            const target = isEnglishTarget ? example.en : example.es;
            const promptTranslation = isEnglishTarget ? example.es : example.en;

            const wordsArray = target.split(' ').map((w, i) => ({
                id: `word-${i}-${w}`,
                text: w
            }));
            const orderedItems = [...wordsArray];
            for (let i = wordsArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [wordsArray[i], wordsArray[j]] = [wordsArray[j], wordsArray[i]];
            }

            dispatch({
                targetSentence: target,
                translation: promptTranslation,
                items: wordsArray,
                correctItems: orderedItems,
                isChecked: false,
                isCorrect: false,
            });
        }
    }, [word, direction]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        dispatch({ items: arrayMove(items, oldIndex, newIndex) });
    };

    const checkAnswer = () => {
        const currentSentence = items.map(i => i.text).join(' ');
        const cleanCurrent = currentSentence.replace(/[.,!?;:¿¡]/g, '').toLowerCase().trim();
        const cleanTarget = targetSentence.replace(/[.,!?;:¿¡]/g, '').toLowerCase().trim();

        if (cleanCurrent === cleanTarget) {
            dispatch({ isChecked: true, isCorrect: true });
            setTimeout(onSuccess, 1500);
        } else {
            // Un fallo debe enseñar: se revela el orden correcto antes de
            // reintentar, con tiempo real para leerlo.
            dispatch({ isChecked: true, isCorrect: false });
            setTimeout(() => {
                dispatch({ isChecked: false });
                onError();
            }, 2600);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full">
            <div className="text-center space-y-4 bg-muted p-6 border-4 border-primary pixel-border w-full shadow-pixel-md-primary">
                <h3 className="text-lg font-mono text-primary uppercase tracking-widest">Ordena la Frase</h3>
                <p className="text-2xl md:text-3xl font-bold text-foreground font-sans tracking-wide">"{translation}"</p>
                <div className="inline-block bg-background px-4 py-2 border-2 border-dashed border-primary mt-2">
                    <p className="text-sm font-mono text-muted-foreground uppercase">
                        Usa la palabra:<br /><span className="text-xl text-primary font-black block mt-1">{word.text}</span>
                    </p>
                </div>
            </div>

            {/* ÁREA DE JUEGO DND-KIT */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                accessibility={{
                    screenReaderInstructions: {
                        draggable: 'Para reordenar palabras, presiona Espacio para tomar la palabra ' +
                            'seleccionada. Mientras la arrastras, usa las flechas izquierda y derecha ' +
                            'para moverla entre posiciones. Presiona Espacio de nuevo para soltarla ' +
                            'en su nueva posición, o Escape para cancelar el movimiento.',
                    },
                    announcements: {
                        onDragStart({ active }) {
                            const label = items.find((i) => i.id === active.id)?.text;
                            return `Tomaste la palabra "${label}".`;
                        },
                        onDragOver({ active, over }) {
                            if (!over) return 'La palabra no está sobre ninguna posición.';
                            const label = items.find((i) => i.id === active.id)?.text;
                            const index = items.findIndex((i) => i.id === over.id);
                            return `Palabra "${label}" movida a la posición ${index + 1} de ${items.length}.`;
                        },
                        onDragEnd({ active, over }) {
                            const label = items.find((i) => i.id === active.id)?.text;
                            if (!over) return `Se soltó "${label}" sin cambiar de posición.`;
                            const index = items.findIndex((i) => i.id === over.id);
                            return `Palabra "${label}" soltada en la posición ${index + 1} de ${items.length}.`;
                        },
                        onDragCancel({ active }) {
                            const label = items.find((i) => i.id === active.id)?.text;
                            return `Se canceló el movimiento de "${label}".`;
                        },
                    },
                }}
            >
                <div className="flex flex-wrap gap-4 justify-center p-8 bg-background min-h-[140px] w-full border-4 border-primary pixel-border shadow-inner">
                    <SortableContext
                        items={items}
                        strategy={horizontalListSortingStrategy}
                    >
                        {items.map((item, index) => (
                            <SortableWord
                                key={item.id}
                                id={item.id}
                                text={item.text}
                                position={index + 1}
                                total={items.length}
                                isChecked={isChecked}
                                isCorrect={isCorrect}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>

            <div className="min-h-16 flex flex-col items-center justify-center w-full mt-4 gap-3">
                {!isChecked ? (
                    <button
                        onClick={checkAnswer}
                        className="px-10 py-4 font-black bg-accent text-xl uppercase pixel-btn w-full md:w-auto shadow-pixel-md hover:translate-y-[2px] hover:shadow-pixel-sm active:translate-y-[4px] active:shadow-none transition-all"
                    >
                        COMPROBAR
                    </button>
                ) : (
                    <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 text-center motion-safe:animate-in fade-in zoom-in-95 duration-300 ease-out">
                        <p className={`text-2xl font-mono ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                            {isCorrect ? '¡EXCELENTE!' : 'INCORRECTO'}
                        </p>
                        {!isCorrect && (
                            <p className="font-sans text-lg text-foreground">
                                El orden correcto era: <strong lang="en" className="text-success">{correctItems.map(i => i.text).join(' ')}</strong>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SentenceBuilder;