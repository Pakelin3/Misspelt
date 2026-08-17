import {
    PixelStarIcon,
    BookIcon,
    SwordIcon,
    LeafIcon,
    PixelSkullIcon,
    PixelFireIcon,
    PixelMagicOrbIcon,
    PixelLightningIcon,
    PixelMoonIcon,
    PixelHoleIcon,
    PixelBookOpenIcon,
} from '@/components/PixelIcons';

// Estas dos constantes vivian dentro del componente, asi que ~20 objetos con
// iconos embebidos se reconstruian en cada render (cada cambio de gameState,
// de personaje o de dificultad). No dependen de props ni de estado.
// Personajes disponibles con sus estadísticas e historia
export const CHARACTERS = [
    {
        id: 'mage', name: 'Mago', sprite: '/game/skins/mage.png',
        stats: { hp: 100, dmg: 10, spd: 350 },
        lore: "Un aprendiz de las artes arcanas que descubrió que las palabras encierran el verdadero poder del universo. Busca el glosario perdido para restaurar el orden.",
        unlockReq: "Desbloqueado por defecto"
    },
    {
        id: 'warlock', name: 'Brujo', sprite: '/game/skins/warlock.png',
        stats: { hp: 20, dmg: 18, spd: 380 },
        lore: "Hizo un pacto con entidades oscuras a cambio de conocimiento prohibido. Su magia es destructiva, pero su fragilidad física es su mayor debilidad.",
        unlockReq: "Derrota al menos 1 Jefe en una partida."
    },
    {
        id: 'erudit', name: 'Erudito', sprite: '/game/skins/erudit.png',
        stats: { hp: 80, dmg: 12, spd: 314.1 },
        lore: "Un bibliotecario ermitaño que ha leído miles de libros. Su velocidad mental y física le permiten esquivar peligros mientras formula encantamientos precisos.",
        unlockReq: "Responde correctamente 100 preguntas en total."
    },
    {
        id: 'farmer', name: 'Campesino', sprite: '/game/skins/farmer.png',
        stats: { hp: 150, dmg: 15, spd: 280 },
        lore: "Cansado de que las plagas arruinaran sus cosechas, tomó su guadaña y aprendió a deletrear hechizos básicos para defender su granja.",
        unlockReq: "Elimina a 2000 palabras enemigas."
    },
];

export const UPGRADES = {
    mage: [
        { name: 'Multicast', tier: 'Nv. 1-3', desc: 'Añade un proyectil adicional. (Máximo 4 proyectiles a la vez).', icon: PixelMagicOrbIcon, color: 'text-info', bg: 'bg-info/20', border: 'border-info/40' },
        { name: 'Disparo Perforante', tier: 'Nv. 4', desc: 'Los proyectiles ahora atraviesan a 1 enemigo.', icon: PixelStarIcon, color: 'text-word-adjective', bg: 'bg-word-adjective/20', border: 'border-word-adjective/40' },
        { name: 'Archimago', tier: 'Nv. 5+', desc: '+20% de Daño Total. (Mejora infinita para el endgame).', icon: PixelLightningIcon, color: 'text-accent', bg: 'bg-accent/20', border: 'border-accent/40', ultimate: true },
    ],
    warlock: [
        { name: 'Corrupción', tier: 'Nv. 1-3', desc: 'Aumenta el tamaño de tu aura oscura en un 15%.', icon: PixelMoonIcon, color: 'text-word-adjective', bg: 'bg-word-adjective/20', border: 'border-word-adjective/40' },
        { name: 'Vacío Famélico', tier: 'Nv. 4-5', desc: 'El aura hace daño un 20% más rápido (reduce el tiempo entre ticks).', icon: PixelHoleIcon, color: 'text-destructive', bg: 'bg-destructive/20', border: 'border-destructive/40' },
        { name: 'Segador de Almas', tier: 'DEF', desc: 'Los enemigos que mueren dentro de tu aura curan 1 HP (cooldown: 2s).', icon: PixelSkullIcon, color: 'text-success', bg: 'bg-success/20', border: 'border-success/40', ultimate: true },
    ],
    erudit: [
        { name: 'Más Conocimiento', tier: 'x6', desc: 'Añade un libro adicional a tu órbita defensiva.', icon: PixelBookOpenIcon, color: 'text-info', bg: 'bg-info/20', border: 'border-info/40' },
        { name: 'Lectura Rápida', tier: 'MAX', desc: 'Los libros giran un 30% más rápido a tu alrededor.', emoji: '💨', color: 'text-info', bg: 'bg-info/20', border: 'border-info/40' },
        { name: 'Libros Pesados', tier: 'DEF', desc: '+10% daño general e infligen +50% de Empuje (Knockback).', icon: BookIcon, color: 'text-warning', bg: 'bg-warning/20', border: 'border-warning/40', ultimate: true },
    ],
    farmer: [
        { name: 'Guadaña Afilada', tier: 'Nv. 1', desc: 'La guadaña atraviesa a 1 enemigo antes de regresar.', icon: LeafIcon, color: 'text-success', bg: 'bg-success/20', border: 'border-success/40' },
        { name: 'Cosecha Magna', tier: 'Nv. 2', desc: 'El tamaño de tu guadaña aumenta un 30%.', icon: LeafIcon, color: 'text-success', bg: 'bg-success/20', border: 'border-success/40' },
        { name: 'Doble Guadaña', tier: 'Nv. 3', desc: 'Lanza una segunda guadaña al mismo tiempo.', icon: SwordIcon, color: 'text-warning', bg: 'bg-warning/20', border: 'border-warning/40' },
        { name: 'Segar Almas', tier: 'Nv. 4', desc: 'Las guadañas atraviesan enemigos de forma infinita (Pierce ∞).', icon: PixelSkullIcon, color: 'text-destructive', bg: 'bg-destructive/20', border: 'border-destructive/40' },
        { name: 'Cosecha Crítica', tier: 'Nv. 5+', desc: '+20% de Daño Total continuo para el late-game.', icon: PixelFireIcon, color: 'text-accent', bg: 'bg-accent/20', border: 'border-accent/40', ultimate: true },
    ],
};
