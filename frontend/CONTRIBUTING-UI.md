# Contrato de UI

Reglas vinculantes para cualquier cambio en `src/`. Salieron de la auditoría del
2026-08-17 y existen para que no vuelva a aparecer la deriva que documenta
`AUDITORIA-FRONTEND.md`.

## Color

Las vistas y componentes consumen **solo** la capa semántica. Nunca una paleta
cruda de Tailwind (`bg-yellow-400`, `text-gray-500`, `border-blue-600`…), nunca un
primitivo (`--pixel-*`) directamente.

| Intención | Token |
|---|---|
| Fondo de página / texto | `bg-background` · `text-foreground` |
| Superficie elevada | `bg-card` · `text-card-foreground` |
| Marca / acción principal | `bg-primary` · `text-primary-foreground` |
| Acento (dorado) | `bg-accent` · `text-accent-foreground` |
| Secundario | `bg-secondary` · `text-secondary-foreground` |
| Atenuado | `bg-muted` · `text-muted-foreground` |
| Éxito | `bg-success` · `text-success-foreground` |
| Aviso | `bg-warning` · `text-warning-foreground` |
| Error / destructivo | `bg-destructive` · `text-destructive-foreground` |
| Información | `bg-info` · `text-info-foreground` |
| Borde / input / foco | `border-border` · `border-input` · `ring-ring` |

Dominio:

- Dificultad: `difficulty-easy` · `difficulty-medium` · `difficulty-hard`
- Tipo de palabra: `word-noun` · `word-verb` · `word-adjective` · `word-slang` · `word-idiom`

Para transparencias usa la sintaxis de slash (`bg-primary/10`), nunca
`rgba(var(--primary), .1)`: `--primary` es una tripleta HSL y `rgba()` con eso es
sintaxis inválida que el navegador descarta en silencio.

## Elevación y tipografía

- Sombras: `shadow-pixel-xs|sm|md|lg|xl|2xl`, más las variantes
  `-primary`, `-accent`, `-destructive`, `-left`. **Prohibido** `shadow-[...]`.
- Texto: escala de Tailwind más `text-3xs` (8px) y `text-2xs` (10px).
  **Prohibido** `text-[Npx]`.
- Fuentes: `font-mono` (Press Start 2P) solo para títulos, etiquetas cortas y
  cifras. `font-sans` (VT323) para todo texto de dos palabras o más — la display
  a tamaño pequeño no se lee. No existe `font-pixel`.
- Capas: `z-base` · `z-raised` · `z-dropdown` · `z-navbar` · `z-modal` ·
  `z-modal-nested` · `z-toast` · `z-loading-overlay`. **Prohibido** `z-[N]`.

## Componentes

- Botones: `@/components/ui/Button`. Variantes `default`, `accent`, `destructive`,
  `success`, `outline`, `secondary`, `ghost`, `link`. No escribas un `<button>`
  con clases pixel a mano ni sobreescribas el radio o el borde del componente.
- Modales: `@/components/ui/Dialog` (Radix). Aporta `role="dialog"`,
  `aria-modal`, trampa de foco, Escape, retorno de foco y bloqueo del scroll.
  **Nunca** construyas un overlay con `<div className="fixed inset-0" onClick=…>`.
- Diálogos y overlays usan `overlay-max-h` (90dvh) con `overflow-y-auto`.
  Usa `dvh`, no `vh`: en móvil la barra del navegador entra en el cálculo.

## Accesibilidad

Es requisito, no acabado. `eslint-plugin-jsx-a11y` está activo y falla el lint.

- Nada interactivo en un `div`. Si algo responde al clic, es un `<button>`.
  Si de verdad no puede serlo: `role` + `tabIndex` + `onKeyDown`.
- Todo `input`/`select`/`textarea` con `<label htmlFor>` apuntando a su `id`.
  Si la etiqueta no debe verse, `className="sr-only"`.
- Errores de formulario: `role="alert"` en el mensaje y `aria-invalid` +
  `aria-describedby` en el campo.
- Iconos decorativos: `aria-hidden="true"`. Botones de solo icono:
  `aria-label`. Estados: `aria-pressed` / `aria-expanded` / `aria-checked`.
- Cargas: `role="status"` con `aria-live="polite"`.
- Objetivo táctil mínimo 44×44 px (`size-11` o `min-h-11`).
- Foco: `focus-visible:ring-2 ring-ring ring-offset-2`. Nunca `outline-none`
  sin reemplazo. Prefiere `focus-visible:` sobre `focus:`.
- Animación: `motion-safe:animate-*`. `index.css` ya neutraliza el movimiento
  bajo `prefers-reduced-motion`, pero no dependas solo de eso.
- Idioma: envuelve el texto en inglés con `lang="en"`. El documento es `lang="es"`.

## Datos y errores

- Todas las llamadas pasan por `useAxios` (lleva el `Authorization` y el refresh).
  No uses `axios` plano ni `fetch` a un tercero: si hace falta una clave, va en un
  endpoint del backend.
- Nunca `alert()`. Errores al usuario con `sonner` o con un nodo `role="alert"`.
- Distingue "sin datos" de "falló la petición". Un error de red no puede
  presentarse como estado vacío.
- Un mensaje de error dice qué pasó y qué puede hacer el usuario. No filtres
  `error.message` ni payloads de DRF a la interfaz.

## Secretos

Cualquier `VITE_*` acaba en texto plano dentro del bundle público. En
`frontend/.env` solo van valores públicos. Las claves de servicios viven en
`backend/.env` y se consumen vía `/game/tts/`, `/game/stt/`, `/game/oracle/`,
`/game/oracle-post-game/` y `/dictionary/suggest-word/`.
