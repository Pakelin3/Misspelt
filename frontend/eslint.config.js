import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'

export default [
  {
    // `public/game` es el build generado por Godot (Emscripten): 180+ errores
    // que no son nuestros y que ahogaban los avisos reales del codigo propio.
    ignores: ['dist', 'public/game/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // Sin estas dos reglas, ESLint no cuenta el uso de un componente dentro de
      // JSX y `no-unused-vars` marca como muerto todo lo que se renderiza. El
      // config anterior lo tapaba con varsIgnorePattern '^[A-Z_]', que a cambio
      // dejaba pasar los imports realmente sin usar.
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',

      'no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Un `div` con onClick necesita rol y manejo de teclado, o ser un <button>.
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-autofocus': 'warn',

      // Techo de complejidad: es lo que permitio que aparecieran componentes de
      // 800 lineas sin que nada protestara.
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', 5],

      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  {
    // Los tests corren en Node (leen el arbol de `src/` para vigilar el contrato
    // de UI), no en el navegador, y usan los globales de Vitest.
    files: ['**/*.{test,spec}.{js,jsx}', 'src/test/**/*.{js,jsx}', '*.config.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
    rules: {
      'max-lines': 'off',
      'no-console': 'off',
    },
  },
]
