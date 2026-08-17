import { useEffect, useState } from 'react';
import { PixelVolume3Icon, PixelChevronIcon } from '@/components/PixelIcons';
import VzlaFlag from '@/assets/ve.svg';
import UsaFlag from '@/assets/us.svg';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { getTypeBadgeStyle, getTypeBadgeText } from '@/lib/wordTypes';

const PRONUNCIATION_VOICE_ID = "IKne3meq5aSn9XLyUdCD";

const WordDetailModal = ({ word, onClose, onOpenOracle }) => {
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
    const { speak, isPlaying } = useTextToSpeech();

    useEffect(() => setCurrentExampleIndex(0), [word]);

    if (!word) return null;

    const examples = word.examples ?? [];
    const currentExample = examples[currentExampleIndex];

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader className="flex-row items-center justify-between gap-3">
                    <DialogTitle className="text-2xl md:text-4xl" lang="en">{word.text}</DialogTitle>
                    <span className={`px-3 py-1 text-2xs font-mono border-2 shadow-pixel-sm uppercase font-bold ${getTypeBadgeStyle(word.word_type)}`}>
                        {getTypeBadgeText(word.word_type)}
                    </span>
                </DialogHeader>

                <div className="space-y-6 font-sans text-xl">
                    <section className="bg-background p-4 border-2 border-dashed border-border">
                        <h3 className="font-mono text-2xs text-accent-strong mb-2 uppercase">Definición</h3>
                        <p className="text-foreground leading-relaxed max-w-prose">{word.definition}</p>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-4 gap-3">
                            <h3 className="font-mono text-2xs text-accent-strong uppercase">Ejemplos de uso</h3>
                            {examples.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Ejemplo anterior"
                                        onClick={() => setCurrentExampleIndex((prev) => (prev > 0 ? prev - 1 : examples.length - 1))}
                                    >
                                        <PixelChevronIcon aria-hidden="true" className="rotate-90" />
                                    </Button>
                                    <span aria-live="polite" className="font-mono text-2xs text-muted-foreground w-12 text-center">
                                        {currentExampleIndex + 1}/{examples.length}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Ejemplo siguiente"
                                        onClick={() => setCurrentExampleIndex((prev) => (prev < examples.length - 1 ? prev + 1 : 0))}
                                    >
                                        <PixelChevronIcon aria-hidden="true" className="-rotate-90" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 min-h-20 flex items-center justify-center bg-muted/30 p-4 border-2 border-dashed border-border">
                            {currentExample ? (
                                <div className="w-full motion-safe:animate-in motion-safe:fade-in duration-300" key={currentExampleIndex}>
                                    {typeof currentExample === 'object' ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <img src={UsaFlag} alt="" aria-hidden="true" width="24" height="24" className="w-6 h-6 shrink-0" />
                                                <p lang="en" className="text-foreground text-base leading-relaxed">{currentExample.en}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <img src={VzlaFlag} alt="" aria-hidden="true" width="24" height="24" className="w-6 h-6 shrink-0" />
                                                <p className="text-muted-foreground italic text-base leading-relaxed">{currentExample.es}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <p lang="en" className="text-foreground text-lg leading-relaxed">{currentExample}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-base text-muted-foreground italic">Esta palabra todavía no tiene ejemplos.</p>
                            )}
                        </div>
                    </section>
                </div>

                <DialogFooter className="mt-8 border-t-4 border-muted sm:justify-stretch">
                    <Button
                        variant="outline"
                        onClick={() => speak(word.text, { rate: 0.85, lang: 'en-US', voiceId: PRONUNCIATION_VOICE_ID })}
                        aria-label={`Escuchar la pronunciación de ${word.text}`}
                    >
                        <PixelVolume3Icon aria-hidden="true" className={isPlaying ? 'motion-safe:animate-pulse' : ''} />
                        Pronunciación
                    </Button>
                    <Button variant="accent" onClick={onOpenOracle} className="flex-1">
                        Consultar al Oráculo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WordDetailModal;
