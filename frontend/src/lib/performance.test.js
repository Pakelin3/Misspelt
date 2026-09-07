import { describe, it, expect } from 'vitest';
import { getPerformanceTextClass, getPerformanceBgClass } from '@/lib/performance';

/**
 * El semaforo de rendimiento estaba escrito a mano y duplicado: dos veces en
 * ProfilePage con `bg-green-500 / bg-yellow-500 / bg-red-500` y otra vez en
 * GamePage con los mismos literales. Ahora es una sola funcion con tokens.
 */
describe('semaforo de rendimiento', () => {
    const casos = [
        { valor: 100, esperado: 'success' },
        { valor: 80, esperado: 'success' },   // el umbral es inclusivo
        { valor: 79.9, esperado: 'warning' },
        { valor: 50, esperado: 'warning' },   // idem
        { valor: 49.9, esperado: 'destructive' },
        { valor: 0, esperado: 'destructive' },
    ];

    it.each(casos)('$valor% -> $esperado', ({ valor, esperado }) => {
        expect(getPerformanceTextClass(valor)).toBe(`text-${esperado}`);
        expect(getPerformanceBgClass(valor)).toBe(`bg-${esperado}`);
    });

    it('nunca devuelve un color crudo de Tailwind', () => {
        const paleta = /-(red|green|yellow|amber|emerald|lime)-[0-9]{2,3}$/;
        for (const v of [0, 25, 50, 75, 100]) {
            expect(getPerformanceTextClass(v)).not.toMatch(paleta);
            expect(getPerformanceBgClass(v)).not.toMatch(paleta);
        }
    });

    it('trata un valor ausente como el peor caso, sin romperse', () => {
        // Un stat que el backend aun no ha calculado no debe pintarse como exito.
        expect(getPerformanceTextClass(undefined)).toBe('text-destructive');
        expect(getPerformanceTextClass(null)).toBe('text-destructive');
    });
});
