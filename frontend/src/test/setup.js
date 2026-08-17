import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom no implementa matchMedia, y varios hooks del proyecto lo consultan
// (tema, prefers-reduced-motion, pointer: fine).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// Radix mide el elemento antes de posicionarlo.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom no implementa localStorage en esta version, y varios componentes lo usan
// para recordar preferencias. Sin esto los tests no podrian cubrir ese camino.
if (!window.localStorage) {
  let datos = {};
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (k in datos ? datos[k] : null),
      setItem: (k, v) => { datos[k] = String(v); },
      removeItem: (k) => { delete datos[k]; },
      clear: () => { datos = {}; },
      key: (i) => Object.keys(datos)[i] ?? null,
      get length() { return Object.keys(datos).length; },
    },
  });
}
