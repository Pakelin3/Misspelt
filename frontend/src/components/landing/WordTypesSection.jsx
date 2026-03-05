import React, { useState } from 'react';

const wordTypes = [
    {
        id: 'VOCABULARY',
        label: 'Vocabulary',
        title: 'General Vocabulary',
        descriptionEn: 'Essential words for daily use. Master the foundations of the language to express yourself clearly in common situations. From basic nouns to descriptive adjectives.',
        descriptionEs: 'Palabras esenciales de uso diario. Domina los cimientos del idioma para poder expresarte con claridad en cualquier situación común. Desde sustantivos básicos hasta adjetivos descriptivos.',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-800',
        activeClass: 'bg-emerald-500 text-white border-emerald-800',
        icon: '📚'
    },
    {
        id: 'SLANG',
        label: 'Slang',
        title: 'Slang',
        descriptionEn: 'Colloquial and modern expressions used on the streets and on the internet. Sound like a native speaker, understand cultural references, and stop sounding like an outdated textbook.',
        descriptionEs: 'Expresiones coloquiales y modernas utilizadas en la calle y en internet. Suena como un hablante nativo, entiende las referencias culturales y deja de sonar como un libro de texto anticuado.',
        colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-800',
        activeClass: 'bg-yellow-500 text-yellow-950 border-yellow-800',
        icon: '🗯️'
    },
    {
        id: 'PHRASAL_VERB',
        label: 'Phrasal Verbs',
        title: 'Phrasal Verbs',
        descriptionEn: 'Compound verbs that change their meaning when a preposition or adverb is added (e.g., "Give up", "Look forward to"). Every student\'s headache, now easier to learn!',
        descriptionEs: 'Verbos compuestos que cambian de significado al añadirles una preposición o adverbio (ej. "Give up", "Look forward to"). El dolor de cabeza de todo estudiante, ¡ahora más fácil de aprender!',
        colorClass: 'bg-blue-100 text-blue-800 border-blue-800',
        activeClass: 'bg-blue-500 text-white border-blue-800',
        icon: '🔄'
    },
    {
        id: 'IDIOM',
        label: 'Idioms',
        title: 'Idioms',
        descriptionEn: 'Set phrases whose figurative meaning is different from the literal one. For example, "Break a leg" doesn\'t mean to actually break it, but to wish you good luck!',
        descriptionEs: 'Frases hechas cuyo significado figurado es distinto al literal. Por ejemplo, "Break a leg" no significa que te rompas una pierna, ¡sino que te desean buena suerte!',
        colorClass: 'bg-purple-100 text-purple-800 border-purple-800',
        activeClass: 'bg-purple-500 text-white border-purple-800',
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

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    <div className="w-full lg:w-5/12 flex flex-col gap-4">
                        {wordTypes.map((type) => {
                            const isActive = activeType.id === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setActiveType(type)}
                                    className={`
                    w-full text-left p-4 flex items-center gap-4 transition-all duration-300
                    font-mono text-lg md:text-xl border-4
                    pixel-btn group relative overflow-hidden
                    ${isActive
                                            ? `${type.activeClass} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-2`
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
              bg-card border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
              p-8 md:p-12 h-full relative overflow-hidden
            `}>
                            <div className="absolute top-0 left-0 w-4 h-4 border-b-4 border-r-4 border-background bg-foreground" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-b-4 border-l-4 border-background bg-foreground" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-t-4 border-r-4 border-background bg-foreground" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-t-4 border-l-4 border-background bg-foreground" />

                            <div
                                key={activeType.id}
                                className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out"
                            >
                                <div className="flex items-center gap-4 mb-6 border-b-4 border-dashed border-muted pb-4">
                                    <span className="text-5xl">{activeType.icon}</span>
                                    <h3 className="font-mono text-3xl md:text-4xl text-foreground">
                                        {activeType.title}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <p className="font-sans text-xl md:text-2xl text-foreground font-medium leading-relaxed italic">
                                        "{activeType.descriptionEn}"
                                    </p>
                                    <p className="font-sans text-xl md:text-2xl text-muted-foreground leading-relaxed border-l-4 border-muted pl-4">
                                        {activeType.descriptionEs}
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t-4 border-dashed border-muted flex items-center justify-between">
                                    <span className={`px-4 py-2 font-mono text-sm border-2 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${activeType.colorClass}`}>
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
