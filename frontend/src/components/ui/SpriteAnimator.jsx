import React from 'react';

/**
 * Componente para animar un spritesheet.
 * Asume que el spritesheet es una tira horizontal de frames.
 * 
 * @param {string} src - Ruta de la imagen del spritesheet.
 * @param {number} frameWidth - Ancho de un solo frame en px (original).
 * @param {number} frameHeight - Alto de un solo frame en px (original).
 * @param {number} frameCount - Número total de frames en la tira.
 * @param {number} fps - Cuadros por segundo de la animación.
 * @param {number} scale - Escala del sprite (default 1).
 * @param {boolean} playing - Si la animación se está reproduciendo.
 */
const SpriteAnimator = ({
    src,
    frameWidth = 32,
    frameHeight = 32,
    frameCount = 4,
    fps = 8,
    scale = 1,
    playing = true,
    className = "",
    style = {}
}) => {
    // Calculamos el ancho total del sheet
    const sheetWidth = frameWidth * frameCount;

    // Duración de la animación en segundos
    const duration = frameCount / fps;

    return (
        <div
            className={`overflow-hidden relative inline-block pixel-art transition-all duration-300 ${className}`}
            style={{
                width: `${frameWidth * scale}px`,
                height: `${frameHeight * scale}px`,
                ...style
            }}
        >
            <div
                style={{
                    backgroundImage: `url(${src})`,
                    backgroundRepeat: 'no-repeat',
                    width: `${sheetWidth * scale}px`,
                    height: `${frameHeight * scale}px`,
                    backgroundSize: `${sheetWidth * scale}px ${frameHeight * scale}px`, // Ajustamos el tamaño del background al escalado
                    animation: playing ? `sprite-animation ${duration}s steps(${frameCount}) infinite` : 'none',
                    imageRendering: 'pixelated' // Importante para pixel art
                }}
            />
            <style>{`
                @keyframes sprite-animation {
                    from { transform: translateX(0); }
                    to { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
};

export default SpriteAnimator;
