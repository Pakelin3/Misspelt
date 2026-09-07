import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as iconos from '@/components/PixelIcons';

/**
 * Contrato del catalogo de iconos.
 *
 * Dos fallos reales que motivan estos tests:
 *  1. 12 iconos tenian `fill="black"` fijo, asi que ninguna clase `text-*` les
 *     afectaba y en el tema oscuro eran negro sobre negro.
 *  2. Ningun icono propagaba props, asi que los 55 `aria-hidden="true"` escritos
 *     en los puntos de uso se descartaban en silencio. Lo peor de ese fallo es
 *     que el codigo *parecia* correcto en la revision.
 */
const fuente = readFileSync(join(process.cwd(), 'src/components/PixelIcons.jsx'), 'utf8');
const componentes = Object.entries(iconos).filter(([, v]) => typeof v === 'function');

describe('catalogo de iconos', () => {
    it('exporta al menos 40 iconos', () => {
        expect(componentes.length).toBeGreaterThanOrEqual(40);
    });

    it.each(componentes)('%s propaga props al <svg>', (nombre, Icono) => {
        const { container } = render(<Icono aria-hidden="true" data-testid={`i-${nombre}`} />);
        const svg = container.querySelector('svg');
        expect(svg, `${nombre} no renderiza un <svg>`).toBeTruthy();
        expect(svg.getAttribute('aria-hidden'), `${nombre} descarta aria-hidden`).toBe('true');
        expect(svg.getAttribute('data-testid')).toBe(`i-${nombre}`);
    });

    it.each(componentes)('%s aplica la className recibida', (nombre, Icono) => {
        const { container } = render(<Icono className="w-9 h-9" />);
        expect(container.querySelector('svg').getAttribute('class')).toContain('w-9');
    });

    it('ningun icono lleva un color fijo: todos siguen al tema', () => {
        // `currentColor` para los monocromos y `hsl(var(--token))` para los que
        // tienen color propio. Nada de hex ni de colores con nombre.
        const prohibidos = fuente.match(/(?:fill|stroke)="(?!currentColor|none|hsl\(var\()[^"]+"/g) ?? [];
        expect(prohibidos, `Colores fuera del sistema: ${prohibidos.join(', ')}`).toEqual([]);
    });

    it('los tres iconos de tema existen y son distintos entre si', () => {
        const { PixelSunIcon, PixelMoonIcon, PixelScreenIcon } = iconos;
        for (const [nombre, Icono] of [['sol', PixelSunIcon], ['luna', PixelMoonIcon], ['pantalla', PixelScreenIcon]]) {
            expect(Icono, `falta el icono de ${nombre}`).toBeTypeOf('function');
        }
        const dibujo = (Icono) => render(<Icono />).container.querySelector('svg').innerHTML;
        const formas = [dibujo(PixelSunIcon), dibujo(PixelMoonIcon), dibujo(PixelScreenIcon)];
        expect(new Set(formas).size, 'dos iconos de tema comparten el mismo dibujo').toBe(3);
    });

    it('todos usan la misma caja de 24x24, para que encajen en la rejilla pixel', () => {
        const malos = componentes
            .filter(([, Icono]) => render(<Icono />).container.querySelector('svg')?.getAttribute('viewBox') !== '0 0 24 24')
            .map(([n]) => n);
        expect(malos, `viewBox distinto de 0 0 24 24: ${malos.join(', ')}`).toEqual([]);
    });
});
