// Etiqueta y color por tipo de palabra. Lo consumen la vista del diccionario, su
// modal de detalle y el panel de administracion, asi que vive en un solo sitio.
export const getTypeBadgeStyle = (type) => {
    switch (type) {
        case 'SLANG': return 'bg-word-slang/15 text-word-slang border-word-slang';
        case 'PHRASAL_VERB': return 'bg-word-noun/15 text-word-noun border-word-noun';
        case 'IDIOM': return 'bg-word-idiom/15 text-word-idiom border-word-idiom';
        case 'VOCABULARY': return 'bg-word-verb/15 text-word-verb border-word-verb';
        default: return 'bg-muted text-muted-foreground border-border';
    }
};

export const getTypeBadgeText = (type) => {
    switch (type) {
        case 'SLANG': return 'JERGA';
        case 'PHRASAL_VERB': return 'VERBO FRASAL';
        case 'IDIOM': return 'MODISMO';
        case 'VOCABULARY': return 'VOCABULARIO';
        default: return 'PALABRA';
    }
};
