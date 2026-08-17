import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
    PixelPlayIcon,
    PixelArrowLeftIcon,
    PixelSparklesIcon,
    PixelLockIcon,
    BookIcon,
} from '@/components/PixelIcons';
import SpriteAnimator from '@/components/ui/SpriteAnimator';
import { CHARACTERS, UPGRADES } from '@/lib/gameData';
import UpgradeTree from '@/components/game/UpgradeTree';

/**
 * Pantalla de seleccion de personaje: radiogroup de heroes, stats, dificultad,
 * arbol de mejoras y los botones que arrancan la partida (normal y tutorial).
 */
const CharacterSelection = ({
    navigate,
    selectedSkin,
    setSelectedSkin,
    unlockedCharacters,
    difficulty,
    setDifficulty,
    isPreparing,
    startGame,
    startTutorialGame,
    startTutorial,
    isTouchOnly,
    preloadProgress,
    preloadStatus,
}) => {
    const currentCharacter = CHARACTERS.find(c => c.id === selectedSkin) || CHARACTERS[0];
    const currentUpgrades = UPGRADES[selectedSkin] || [];
    const [showUpgrades, setShowUpgrades] = useState(false);

    // Reset upgrades panel when character changes
    useEffect(() => {
        setShowUpgrades(false);
    }, [selectedSkin]);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 p-4 relative z-10">
            <h1 className="text-4xl md:text-6xl text-center font-black text-primary drop-shadow-pixel animate-in slide-in-from-top-4 duration-500">
                MISSPELT SURVIVOR
            </h1>

            <Card className=" border-primary bg-background p-6 pixel-border w-full max-w-5xl rounded-none animate-in zoom-in-95 duration-500 delay-150">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Panel Izquierdo: Selección de Personaje */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold uppercase text-center mb-6 text-foreground">Elige tu Héroe</h2>

                        <div
                            id="tutorial-game-heroes"
                            role="radiogroup"
                            aria-label="Elige tu héroe"
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
                        >
                            {CHARACTERS.map((char) => {
                                const isUnlocked = unlockedCharacters.includes(char.id);
                                const isSelected = selectedSkin === char.id;
                                return (
                                    // Antes era un <div onClick> sin rol ni tabIndex: elegir personaje
                                    // era imposible sin raton, y ese es el paso obligatorio para jugar.
                                    <button
                                        type="button"
                                        key={char.id}
                                        role="radio"
                                        aria-checked={isSelected}
                                        aria-label={isUnlocked ? char.name : `${char.name} (bloqueado: ${char.unlockReq})`}
                                        onClick={() => {
                                            if (isUnlocked) {
                                                setSelectedSkin(char.id);
                                            } else {
                                                toast.info('Personaje bloqueado', { description: char.unlockReq });
                                            }
                                        }}
                                        className={`
                                            relative flex flex-col items-center p-4 border-4 transition-all duration-200
                                            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2
                                            ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}
                                            ${isSelected
                                                ? 'border-primary bg-primary/10 scale-105 shadow-pixel-md z-raised'
                                                : isUnlocked
                                                    ? 'border-muted bg-muted/50 hover:border-primary/50 hover:scale-105'
                                                    : 'border-muted bg-muted/20 grayscale'
                                            }
                                        `}
                                    >
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-background p-2 border-2 border-foreground shadow-md rounded-none">
                                                    <PixelLockIcon aria-hidden="true" className="text-muted-foreground w-5 h-5" />
                                                </div>
                                            </div>
                                        )}
                                        <div className={`mb-2 overflow-hidden pixel-rendering ${!isUnlocked ? 'opacity-30' : ''}`}>
                                            <SpriteAnimator
                                                src={char.sprite}
                                                frameWidth={32}
                                                frameHeight={32}
                                                frameCount={4}
                                                fps={isSelected ? 8 : 4}
                                                scale={3}
                                                style={{
                                                    filter: isSelected ? 'none' : 'grayscale(100%) opacity(0.7)'
                                                }}
                                            />
                                        </div>
                                        <span aria-hidden="true" className={`uppercase font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'} ${!isUnlocked ? 'opacity-50' : ''}`}>
                                            {char.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Panel Derecho: Lore, Stats y Opciones */}
                    <div className="flex-1 flex flex-col justify-between bg-muted/20 border-4 border-foreground p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-2 bg-foreground"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 bg-foreground"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 bg-foreground"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-foreground"></div>

                        <div id="tutorial-game-stats">
                            <h3 className="text-3xl font-black text-primary uppercase mb-2 drop-shadow-sm">
                                {currentCharacter.name}
                            </h3>
                            <p className="text-base font-sans text-muted-foreground italic mb-2 leading-relaxed border-l-4 border-primary pl-4">
                                "{currentCharacter.lore}"
                            </p>

                            {!unlockedCharacters.includes(currentCharacter.id) && (
                                <div className="mb-6 p-3 border-2 border-destructive/50 bg-destructive/10 flex items-start gap-3 animate-in pulse duration-1000">
                                    <PixelLockIcon aria-hidden="true" className="text-destructive shrink-0 mt-0.5 w-4 h-4" />
                                    <div>
                                        <p className="text-xs font-bold text-destructive uppercase mb-0.5">Personaje Bloqueado</p>
                                        <p className="text-sm font-sans text-muted-foreground">{currentCharacter.unlockReq}</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 mb-8 mt-4">
                                {[
                                    { label: 'HP', value: currentCharacter.stats.hp, max: 200, color: 'bg-destructive' },
                                    { label: 'DMG', value: currentCharacter.stats.dmg, max: 20, color: 'bg-warning' },
                                    { label: 'SPD', value: currentCharacter.stats.spd, max: 500, color: 'bg-info' },
                                ].map(stat => {
                                    const filled = Math.round((stat.value / stat.max) * 10);
                                    return (
                                        <div key={stat.label} className="flex items-center gap-3">
                                            <span className="font-bold text-xs uppercase w-10 text-muted-foreground">{stat.label}</span>
                                            <div className="flex gap-1 flex-1">
                                                {[...Array(10)].map((_, i) => (
                                                    <div
                                                        key={`${stat.label}-${i}`}
                                                        className={`w-3 h-3 border-2 border-foreground/60 transition-all duration-300 ${i < filled ? stat.color : 'bg-background'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs font-bold w-8 text-right text-foreground">{stat.value}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Botón para abrir el Árbol de Mejoras*/}
                            <Button
                                id="tutorial-game-upgrades"
                                variant="outline"
                                onClick={() => setShowUpgrades(true)}
                                className="w-full mb-6 relative h-12 text-xs rounded-none font-bold uppercase pixel-btn border-2 border-accent hover:bg-accent hover:text-accent-foreground text-accent group overflow-hidden shadow-pixel-sm hover:shadow-pixel-sm hover:-translate-y-0.5 transition-all"
                            >
                                <PixelSparklesIcon className="w-4 h-4 mr-2 group-hover:animate-spin" />
                                Ver Árbol de Mejoras
                            </Button>

                            <div id="tutorial-game-difficulty" className="mb-6">
                                <span className="block font-bold text-sm uppercase mb-2 text-center text-muted-foreground">Dificultad de Palabras</span>
                                <div className="flex gap-2">
                                    {['EASY', 'NORMAL', 'HARD'].map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setDifficulty(lvl)}
                                            className={`
                                                flex-1 py-2 text-xs font-bold uppercase pixel-btn border-2 transition-all
                                                ${difficulty === lvl
                                                    ? 'border-foreground bg-primary text-primary-foreground shadow-pixel-sm translate-y-[-2px]'
                                                    : 'border-muted-foreground bg-background text-muted-foreground hover:bg-muted/50'}
                                            `}
                                        >
                                            {lvl === 'EASY' ? 'FÁCIL' : lvl === 'NORMAL' ? 'NORMAL' : 'DIFÍCIL'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 flex-col lg:flex-row mt-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/')}
                                className="w-full lg:w-1/4 rounded-none h-14 text-sm pixel-btn border-2 border-foreground hover:bg-muted"
                            >
                                <PixelArrowLeftIcon className="mr-2 w-6 h-6" /> VOLVER
                            </Button>
                            <Button
                                variant="outline"
                                onClick={startTutorialGame}
                                id="tutorial-game-howtoplay"
                                className="w-full lg:w-1/4 rounded-none h-14 text-sm pixel-btn border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground shadow-pixel-sm hover:shadow-pixel-sm hover:-translate-y-0.5 transition-all"
                            >
                                <BookIcon className="mr-2 w-5 h-5" /> COMO JUGAR
                            </Button>
                            <Button
                                onClick={startGame}
                                id="tutorial-game-start"
                                disabled={isPreparing}
                                className={`w-full lg:w-2/4 hover:bg-accent  rounded-none h-14 text-xl pixel-btn shadow-pixel-md hover:translate-y-[2px] hover:shadow-pixel-sm transition-all bg-accent text-accent-foreground ${isPreparing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isPreparing ? (
                                    <>
                                        <div aria-hidden="true" className="w-5 h-5 border-4 border-foreground border-t-transparent motion-safe:animate-spin rounded-full mr-2"></div>
                                        PREPARANDO...
                                    </>
                                ) : (
                                    <>
                                        <PixelPlayIcon aria-hidden="true" className="mr-2 fill-current" /> INICIAR PARTIDA
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* El motor pesa ~82 MB: el jugador merece saber
                            cuanto queda en lugar de mirar una pantalla negra. */}
                        {!isTouchOnly && preloadStatus === 'loading' && (
                            <div className="mt-4" role="status" aria-live="polite">
                                <div className="flex items-center justify-between mb-2 font-mono text-3xs uppercase text-muted-foreground">
                                    <span>Descargando el juego</span>
                                    <span>{preloadProgress}%</span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={preloadProgress}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Progreso de descarga del juego"
                                    className="h-4 border-2 border-foreground bg-muted overflow-hidden"
                                >
                                    <div
                                        className="h-full bg-primary transition-[width] duration-300"
                                        style={{ width: `${preloadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {!isTouchOnly && preloadStatus === 'ready' && (
                            <p className="mt-4 font-sans text-base text-success text-center">
                                Juego listo para empezar.
                            </p>
                        )}

                        {isTouchOnly && (
                            <div role="alert" className="mt-4 border-4 border-warning bg-warning/10 p-4 text-center">
                                <p className="font-mono text-2xs uppercase text-warning mb-2">
                                    Este modo necesita teclado
                                </p>
                                <p className="font-sans text-lg text-foreground">
                                    El juego se controla con teclado y raton, asi que en un movil o tablet
                                    no podras moverte. Practica con el quiz mientras tanto.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => navigate('/quiz')}
                                >
                                    Ir al quiz
                                </Button>
                            </div>
                        )}

                        {/* Upgrades Overlay */}
                        {showUpgrades && (
                            <UpgradeTree
                                character={currentCharacter}
                                upgrades={currentUpgrades}
                                onClose={() => setShowUpgrades(false)}
                            />
                        )}
                    </div>
                </div>
            </Card>

            <button
                onClick={startTutorial}
                className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-accent-foreground pixel-border flex items-center justify-center text-2xl hover:scale-110 transition-transform z-dropdown shadow-pixel-md hover:shadow-pixel-lg"
                title="Ver Tutorial de Nuevo"
            >
                <span className="font-mono text-3xl pb-1">?</span>
            </button>
        </div>
    );
};

export default CharacterSelection;
