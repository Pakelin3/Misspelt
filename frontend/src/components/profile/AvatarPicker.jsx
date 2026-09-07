import React from 'react';
import normalizarUrlDeMedia from '@/utils/mediaUrl';

// Selector de avatar dentro del formulario de edición. Solo permite elegir
// entre los avatares ya desbloqueados; el texto explica cómo conseguir más
// porque antes el número "Avatares: N" aparecía sin ningún contexto.
const AvatarPicker = ({ avatars, selectedId, onSelect }) => (
    <div>
        <span id="avatar-picker-label" className="text-2xs font-mono uppercase text-muted-foreground block mb-1">Avatar</span>
        <div role="group" aria-labelledby="avatar-picker-label" className="flex flex-wrap gap-2">
            {(avatars || []).map(av => (
                <button
                    key={av.id}
                    type="button"
                    onClick={() => onSelect(av.id)}
                    aria-pressed={selectedId === av.id}
                    aria-label={av.name}
                    className={`w-14 h-14 p-1 border-2 transition-all ${selectedId === av.id
                        ? 'border-primary bg-primary/20 scale-110'
                        : 'border-foreground/30 hover:border-foreground'
                        }`}
                >
                    <img src={normalizarUrlDeMedia(av.image)} alt="" aria-hidden="true" loading="lazy" width={48} height={48} className="w-full h-full object-contain" />
                </button>
            ))}
        </div>
        <p className="text-3xs font-mono text-muted-foreground mt-2 leading-snug">
            Desbloqueas nuevos avatares al subir de nivel y ganar insignias. ¡Sigue jugando para ampliar tu colección!
        </p>
    </div>
);

export default AvatarPicker;
