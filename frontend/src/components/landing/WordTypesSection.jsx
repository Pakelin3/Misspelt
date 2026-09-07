import React, { useState } from 'react';

const wordTypes = [
    {
        id: 'VOCABULARY',
        label: 'Vocabulary',
        title: 'General Vocabulary',
        descriptionEn: 'Essential words for daily use. Master the foundations of the language to express yourself clearly in common situations. From basic nouns to descriptive adjectives.',
        descriptionEs: 'Palabras esenciales de uso diario. Domina los cimientos del idioma para poder expresarte con claridad en cualquier situación común. Desde sustantivos básicos hasta adjetivos descriptivos.',
        colorClass: 'bg-word-verb/15 text-word-verb border-word-verb',
        activeClass: 'bg-word-verb text-primary-foreground border-foreground',
        icon: '📚'
    },
    {
        id: 'SLANG',
        label: 'Slang',
        title: 'Slang',
        descriptionEn: 'Colloquial and modern expressions used on the streets and on the internet. Sound like a native speaker, understand cultural references, and stop sounding like an outdated textbook.',
        descriptionEs: 'Expresiones coloquiales y modernas utilizadas en la calle y en internet. Suena como un hablante nativo, entiende las referencias culturales y deja de sonar como un libro de texto anticuado.',
        colorClass: 'bg-word-slang/15 text-word-slang border-word-slang',
        activeClass: 'bg-word-slang text-accent-foreground border-foreground',
        icon: '🗯️'
    },
    {
        id: 'PHRASAL_VERB',
        label: 'Phrasal Verbs',
        title: 'Phrasal Verbs',
        descriptionEn: 'Compound verbs that change their meaning when a preposition or adverb is added (e.g., "Give up", "Look forward to"). Every student\'s headache, now easier to learn!',
        descriptionEs: 'Verbos compuestos que cambian de significado al añadirles una preposición o adverbio (ej. "Give up", "Look forward to"). El dolor de cabeza de todo estudiante, ¡ahora más fácil de aprender!',
        colorClass: 'bg-word-noun/15 text-word-noun border-word-noun',
        activeClass: 'bg-word-noun text-info-foreground border-foreground',
        icon: '🔄'
    },
    {
        id: 'IDIOM',
        label: 'Idioms',
        title: 'Idioms',
        descriptionEn: 'Set phrases whose figurative meaning is different from the literal one. For example, "Break a leg" doesn\'t mean to actually break it, but to wish you good luck!',
        descriptionEs: 'Frases hechas cuyo significado figurado es distinto al literal. Por ejemplo, "Break a leg" no significa que te rompas una pierna, ¡sino que te desean buena suerte!',
        colorClass: 'bg-word-adjective/15 text-word-adjective border-word-adjective',
        activeClass: 'bg-word-adjective text-primary-foreground border-foreground',
        icon: '🎭'
    }
];

export function WordTypesSection() {
    const [activeType, setActiveType] = useState(wordTypes[0]);

    return (
        <section className="py-20 bg-background relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="font-mono text-2xl md:text-4xl text-foreground mb-4">
                        TIPOS DE PALABRAS
                    </h2>
                    <p className="font-sans text-xl text-muted-foreground max-w-2xl mx-auto">
                        Descubre los diferentes tipos de cartas de conocimiento que coleccionarás en tu aventura.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start min-w-0">
                    <div className="w-full min-w-0 lg:w-5/12 flex flex-col gap-4">
                        {wordTypes.map((type) => {
                            const isActive = activeType.id === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setActiveType(type)}
                                    className={`
                    w-full min-w-0 text-left p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all duration-300
                    font-mono text-lg md:text-xl border-4
                    pixel-btn group relative overflow-hidden
                    ${isActive
                                            ? `${type.activeClass} shadow-pixel-md translate-x-2`
                                            : `bg-card text-foreground border-muted hover:border-foreground hover:bg-muted/50`
                                        }
                  `}
                                >
                                    <span className="text-2xl lg:text-3xl">{type.icon}</span>
                                    <span className="flex-1 font-bold z-10 relative">{type.label}</span>

                                    {isActive && (
                                        <span className="animate-pulse">▶</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-full lg:w-7/12 min-h-[300px]">
                        <div className={`
              bg-card border-4 border-foreground shadow-pixel-xl 
              p-8 md:p-12 h-full relative overflow-hidden
            `}>
                            <div className="absolute top-0 left-0 w-4 h-4 border-b-4 border-2 border-background bg-foreground" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-b-4 border-2 border-background bg-foreground" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-t-4 border-2 border-background bg-foreground" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-t-4 border-2 border-background bg-foreground" />

                            <div
                                key={activeType.id}
                                className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out"
                            >
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 border-b-4 border-dashed border-muted pb-4">
                                    <span aria-hidden="true" className="text-4xl sm:text-5xl shrink-0">{activeType.icon}</span>
                                    <h3 lang="en" className="font-mono text-xl sm:text-2xl md:text-4xl text-foreground break-words min-w-0">
                                        {activeType.title}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <p className="font-sans text-xl md:text-2xl text-foreground font-medium leading-relaxed italic">
                                        "{activeType.descriptionEn}"
                                    </p>
                                    <p className="font-sans text-xl md:text-2xl text-muted-foreground leading-relaxed border-2 border-muted pl-4">
                                        {activeType.descriptionEs}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t-4 border-dashed border-muted flex items-center justify-between">
                                    <span className={`px-4 py-2 font-mono text-sm border-2 font-bold shadow-pixel-sm ${activeType.colorClass}`}>
                                        EJEMPLO DISPONIBLE EN EL JUEGO
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
