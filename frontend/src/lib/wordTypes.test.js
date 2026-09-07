import { describe, it, expect } from 'vitest';
import { getTypeBadgeStyle, getTypeBadgeText } from '@/lib/wordTypes';

/**
 * Estos helpers estaban duplicados entre la vista del diccionario, su modal de
 * detalle y el panel de administracion, y con colores crudos de Tailwind
 * distintos en cada copia. Ahora viven en un solo sitio; estos tests fijan que
 * sigan devolviendo tokens del sistema y que ningun tipo se quede sin traducir.
 */
const TIPOS = ['VOCABULARY', 'SLANG', 'PHRASAL_VERB', 'IDIOM'];
const PALETAS = /\b(bg|text|border)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|gray|slate|stone|zinc|neutral)-[0-9]{2,3}\b/;

describe('getTypeBadgeText', () => {
    it('traduce todos los tipos al español', () => {
        for (const tipo of TIPOS) {
            const texto = getTypeBadgeText(tipo);
            expect(texto).toBeTruthy();
            // Nada de claves crudas en ingles llegando a la interfaz.
            expect(texto).not.toBe(tipo);
        }
    });

    it('da una etiqueta razonable para un tipo desconocido', () => {
        expect(getTypeBadgeText('ALGO_NUEVO')).toBeTruthy();
        expect(getTypeBadgeText(undefined)).toBeTruthy();
    });
});

describe('getTypeBadgeStyle', () => {
    it('devuelve solo tokens semanticos, nunca la paleta cruda de Tailwind', () => {
        for (const tipo of [...TIPOS, 'DESCONOCIDO', undefined]) {
            expect(getTypeBadgeStyle(tipo)).not.toMatch(PALETAS);
        }
    });

    it('distingue visualmente cada tipo de palabra', () => {
        const estilos = TIPOS.map(getTypeBadgeStyle);
        expect(new Set(estilos).size).toBe(TIPOS.length);
    });

    it('siempre define color de fondo, de texto y de borde', () => {
        for (const tipo of TIPOS) {
            const estilo = getTypeBadgeStyle(tipo);
            expect(estilo, `${tipo} sin fondo`).toMatch(/\bbg-/);
            expect(estilo, `${tipo} sin color de texto`).toMatch(/\btext-/);
            expect(estilo, `${tipo} sin borde`).toMatch(/\bborder-/);
        }
    });
});
