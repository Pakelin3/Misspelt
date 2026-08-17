// Mapeo único de categoría de insignia -> etiqueta en español y clases de
// color semánticas. Antes vivía duplicado (y desincronizado) en
// ProfilePage.jsx (mostraba la clave cruda en inglés) y BadgesPage.jsx
// (sí traducía). Cualquier vista que muestre insignias debe consumir esto.
export const BADGE_CATEGORIES = [
    {
        key: 'LEGENDARY',
        label: 'Legendarias',
        textClass: 'text-rarity-legendary',
        borderClass: 'border-rarity-legendary',
        bgClass: 'bg-rarity-legendary/10',
        accentBgClass: 'bg-rarity-legendary',
        accentFgClass: 'text-accent-foreground',
        glowClass: 'shadow-glow-accent',
    },
    {
        key: 'EPIC',
        label: 'Épicas',
        textClass: 'text-rarity-epic',
        borderClass: 'border-rarity-epic',
        bgClass: 'bg-rarity-epic/10',
        accentBgClass: 'bg-rarity-epic',
        accentFgClass: 'text-primary-foreground',
        glowClass: 'shadow-glow-legendary',
    },
    {
        key: 'RARE',
        label: 'Raras',
        textClass: 'text-rarity-rare',
        borderClass: 'border-rarity-rare',
        bgClass: 'bg-rarity-rare/10',
        accentBgClass: 'bg-rarity-rare',
        accentFgClass: 'text-info-foreground',
        glowClass: 'shadow-glow-info',
    },
    {
        key: 'BASIC',
        label: 'Básicas',
        textClass: 'text-rarity-basic',
        borderClass: 'border-rarity-basic/50',
        bgClass: 'bg-muted/20',
        accentBgClass: 'bg-muted-foreground',
        accentFgClass: 'text-background',
        glowClass: '',
    },
];

const CATEGORY_BY_KEY = Object.fromEntries(BADGE_CATEGORIES.map(cat => [cat.key, cat]));

/** Devuelve la config de color/etiqueta para una categoría de insignia, con BASIC como respaldo. */
export function getBadgeCategoryConfig(categoryKey) {
    return CATEGORY_BY_KEY[categoryKey] || CATEGORY_BY_KEY.BASIC;
}

/** Devuelve solo la etiqueta traducida (ej. 'LEGENDARY' -> 'Legendarias'). */
export function getBadgeCategoryLabel(categoryKey) {
    return getBadgeCategoryConfig(categoryKey).label;
}
