# Auditoría y Plan de Optimización — Frontend Misspelt

**Fecha:** 2026-08-17 · **Rama:** `dev` · **Alcance:** `frontend/` (React 19, Vite 6, Tailwind 4, react-router 7)
**Método:** 6 auditorías paralelas (a11y, rendimiento/bundle, arquitectura/estado, sistema de diseño/theming, responsive, flujo UX/copy) + detector mecánico de antipatrones + verificación manual de los hallazgos de mayor impacto contra el bundle compilado.

---

## Puntuación de salud

| # | Dimensión | Nota | Hallazgo principal |
|---|---|---|---|
| 1 | Accesibilidad | **1/4** | Selección de personaje inoperable por teclado; 6 modales sin `role="dialog"`, focus trap ni Escape |
| 2 | Rendimiento | **1/4** | Chunk único de 3.83 MB, cero code-splitting de rutas |
| 3 | Responsive | **3/4** | Base sólida; el modo juego y el chat del Oráculo se rompen en móvil |
| 4 | Theming | **0/4** | El modo oscuro no existe: no hay ni un bloque `.dark` en el CSS |
| 5 | Integridad de implementación | **1/4** | `ui/Button` genérico ignorado por 95 botones a mano; landing y app shell no parecen el mismo producto |
| | **Total** | **6/20** | **Poor — requiere revisión mayor** |

**Dimensiones transversales:** claridad de flujo 1/4 · feedback pedagógico 1/4 · manejo de errores 1/4 · salud arquitectónica 1.5/4

---

## Veredicto de integridad

**No pasa.** No es que falten detalles: hay tres sistemas construidos a medias y desconectados que la UI presenta como funcionales.

1. **Modo oscuro.** Existe el botón sol/luna, existe `ThemeContext`, existe `next-themes` en `package.json`. No existe una sola regla CSS que reaccione al tema. Verificado: `grep 'dark:'` en todo `src/` → **1 ocurrencia**; `.dark` en `index.css` → **0**; `@custom-variant` → **0**. El toggle escribe en `localStorage` y no cambia un píxel.
2. **Internacionalización.** `src/context/LenguageContext.jsx` pesa **0 bytes** y nadie lo importa. `DropdownLenguage.jsx` cambia la bandera y hace `console.log`. Es un producto para aprender inglés con un selector de idioma decorativo.
3. **Sistema de diseño.** `ui/Button` y `ui/Card` son scaffolding shadcn intacto (`rounded-md`), sin nada del lenguaje pixel del producto. Resultado medido: **95 `<button>` a mano en 28 archivos** contra **7 archivos** que importan `ui/Button` — y quien lo importa lo sobreescribe (`AvatarAdminPanel.jsx:181` reescribe radio, borde y hover encima del componente base).

La landing (`components/landing/*`) sí tiene punto de vista propio: consume tokens, usa `pixel-border*`, animaciones a medida. El app shell se disuelve en Tailwind genérico — 265 usos de color crudo en 51 tonos distintos, concentrados en `GamePage` (31), `ProfilePage` (17), `BadgesPage` (16). El semáforo `bg-green-500 / bg-yellow-500 / bg-red-500` de `ProfilePage.jsx:18,21` es indistinguible de cualquier dashboard por defecto, con `--accent` dorado y `--destructive` ya definidos y sin usar.

---

## P0 — Bloqueantes

### P0.1 · Claves de API publicadas en el bundle

Vite inlinea en texto plano **toda** variable `VITE_*` que el código referencie. Verificado contra `dist/assets/index-BqQQlnby.js`: una clave de ElevenLabs de 51 caracteres aparece **6 veces**, junto a 257 referencias a la cabecera `xi-api-key`.

| Variable | Referenciada en | Estado |
|---|---|---|
| `VITE_ELEVENLABS_API_KEY` | `OracleChat.jsx:22`, `DictionaryPage.jsx:384`, `ListeningChallenge.jsx:41,148` | **Filtrada y confirmada en el bundle** |
| `VITE_GITHUB_API_KEY_PAT_ISSUES` | `WordSuggestionModal.jsx:29` | Se filtra en todo build donde esté definida |
| `VITE_GEMINI_API_KEY` | `OracleChat.jsx:21` | Se filtra en todo build donde esté definida |
| `VITE_GOOGLE_CLIENT_SECRET` | *(sin usar)* | No filtrada hoy — la primera línea que la lea la publica |
| `VITE_RESEND_API_KEY` | *(sin usar)* | Igual |
| `VITE_OPENAI_API_KEU` | `OracleChat.jsx:21` | Typo `KEU`: ese fallback nunca resuelve |

Acciones:
1. **Revocar y rotar** la clave de ElevenLabs y el PAT de GitHub. Están desplegadas en Vercel; asumir compromiso, no "por si acaso".
2. Proxy en el backend Django existente: `POST /api/tts/`, `POST /api/oracle/`, `POST /api/word-suggestion/`. El patrón correcto **ya existe** en el repo — `OracleChatDictionary.jsx` llama `api.post('/game/oracle/', …)`. Replicarlo.
3. Rate limiting por usuario en esos proxies, o la cuota se agota igual, solo que autenticada.
4. Renombrar `VITE_GOOGLE_CLIENT_SECRET` y `VITE_RESEND_API_KEY` sin prefijo `VITE_` y moverlas al backend.
5. Eliminar `@elevenlabs/elevenlabs-js`: es el SDK **de servidor** (Node) importado en el navegador (`ListeningChallenge.jsx:3`, `DictionaryPage.jsx:4`), y el mismo archivo ya tiene un fallback con `fetch` — es redundante incluso funcionalmente.

### P0.2 · Script de terceros sin uso, bloqueante

`index.html:11` carga `https://js.puter.com/v2/` de forma síncrona en el `<head>`. `grep -rn "puter" src/` → **0 coincidencias**. Es un tercero no auditado con ejecución total en la página, retrasando el FCP, para nada. Borrar la línea.

### P0.3 · Ningún modal es un diálogo accesible

`DictionaryPage.jsx:442`, `WordSuggestionModal.jsx:78`, `StudentProfileModal.jsx:59`, `GamePage.jsx:580,669`, `QuizManager.jsx:153` son `<div className="fixed inset-0">` planos: sin `role="dialog"`, sin `aria-modal`, sin focus trap, sin retorno de foco, sin Escape, sin bloqueo de scroll del body.

El arreglo es barato porque **`src/components/ui/Dialog.jsx` ya envuelve Radix**, que resuelve todo eso de fábrica y no lo usa ningún modal de negocio. Migrar los 6.

### P0.4 · Selección de personaje inoperable por teclado

`GamePage.jsx:413-457`: `<div onClick={...}>` sin `role`, `tabIndex` ni `onKeyDown`. El flujo principal del juego es inaccesible sin ratón. WCAG 2.1.1, nivel A.

### P0.5 · `ListeningChallenge` bloquea a usuarios sordos

`ListeningChallenge.jsx:213-261`: la única vía de conocer la palabra es el audio. `word.text` está en memoria (se usa en la línea 197 para comparar) y nunca se ofrece como alternativa. Sin transcripción, sin pausa, y los errores salen por `alert()` nativo (líneas 97, 186) con `error.message` crudo.

Añadir un botón "¿No puedes escuchar? Ver transcripción" — preserva el reto para quien sí oye y desbloquea a quien no.

---

## P1 — Graves

**Rendimiento**
- **Cero code-splitting.** `App.jsx:6-18` importa las 13 vistas estáticamente, admin incluido. Quien entra a `/login` descarga los 6 paneles de administración, Chart.js, GSAP, driver.js y `@dnd-kit`. El único `lazy()` del proyecto (`DashboardStatsCards.jsx:7`) ya generó su chunk de 204 KB: el patrón funciona, solo no se aplicó. Estimado: **800 KB – 1.2 MB** fuera del chunk inicial.
- **`vite.config.js` sin bloque `build`**: sin `manualChunks`, sin `target`, sin compresión, sin analizador.
- **Contextos sin memoizar.** `AuthContext.jsx:274` y `ThemeContext.jsx:24` crean el objeto `value` en cada render → el `setInterval` de refresh de token (`AuthContext.jsx:317`) provoca **re-render de toda la app cada 4 minutos**.
- **Fuente duplicada y bloqueante.** `index.css:1` reimporta `Press Start 2P` vía `@import` (render-blocking) sobre el `<link>` de `index.html:9`.
- **`react-data-table-component` instalado y jamás importado** (`grep DataTable` → 0).
- **Godot de 82 MB sin barra de progreso ni `onError`** (`GamePage.jsx:652-665`): pantalla negra indefinida en conexiones lentas, en la feature más premium del producto. Precargar `index.wasm`/`index.pck` durante la pantalla de selección, donde el usuario ya está gastando tiempo.
- **Sin `AbortController` en ninguna petición** (0 coincidencias en `src/`): `DictionaryPage.jsx:148-158` refetchea con cada cambio de búsqueda/filtro/página y las respuestas lentas pisan a las rápidas.

**Seguridad de sesión**
- Tokens `access` + `refresh` completos en `localStorage` (`AuthContext.jsx:18-27`, `useAxios.jsx:43`) → cualquier XSS secuestra la sesión de forma persistente.
- **Dos mecanismos de refresh compitiendo sin coordinación:** `setInterval` cada 4 min (`AuthContext.jsx:315-322`) *y* el interceptor de request de `useAxios.jsx:18-55`, que además crea una instancia de axios por componente (17 archivos lo usan). Con `ROTATE_REFRESH_TOKENS` activado en el backend, dos refresh concurrentes = logout accidental de un usuario con sesión válida.
- `useAxios` no tiene interceptor de **response**: un 401 real del servidor (reloj desincronizado, revocación) no se reintenta ni se maneja.

**Bug silencioso confirmado**
- **8 usos de `rgba(var(--primary), 0.5)`** (`QuizManager.jsx:106,136,142,153,158`, `MultiChoice.jsx:54`, `ListeningChallenge.jsx:215`) donde `--primary` es una tripleta HSL (`100 38% 35%`). `rgba(100 38% 35%, .5)` es sintaxis inválida: el navegador descarta la declaración. Esas sombras nunca se han renderizado. Arreglo: `color-mix(in srgb, hsl(var(--primary)) 50%, transparent)`.

**Flujo**
- **El CTA principal de la landing rompe la conversión.** `HeroSection.jsx:74` despacha `start-game-loading`; `Navbar.jsx:76-78` navega a `/play`, ruta privada → rebote a `/login`. El botón más grande de la página manda al visitante nuevo a un muro, no a registro.
- **Tras login, `navigate('/')`** (`AuthContext.jsx:93-95`): el usuario aterriza en la landing de marketing. Sin resumen de progreso, sin siguiente paso, sin tour — driver.js está integrado en Dictionary, Profile y Game, pero no en el primer aterrizaje, que es justo donde se necesita.
- **`/dashboard` está huérfano y roto.** Registrado en `App.jsx:39`, no enlazado desde ninguna parte. `Dashboard.jsx:14` hace `jwtDecode` sobre `localStorage.getItem("authTokens")`, que es un JSON `{access, refresh}`, no un JWT → siempre lanza → saludo eterno **"Jelouda Guest!"** (línea 40, con typo) y un `<strong>` con el resultado crudo de `GET /test/`.
- **Barra de progreso del quiz comentada** (`QuizManager.jsx:196-205`): se construyó y se apagó. El usuario no sabe cuántas preguntas faltan.
- **`/forgot-password` enlazado** (`LoginPage.jsx:151`) **y no registrado** en `App.jsx`. Enlace muerto en el flujo de login.
- **Fallos de red disfrazados de "sin contenido".** `QuizPage.jsx:32-35` captura cualquier error con `console.error` y muestra "No hay palabras disponibles para practicar" — una caída de red o una sesión caducada parecen falta de contenido.
- **`CheckEmailPage.jsx:41`** — "YA ME VERIFIQUÉ" no verifica nada, solo navega a login.
- **Tres mensajes distintos de sesión expirada** según qué código lo detecte (`AuthContext.jsx:212`, `:240`, `:299-301`).
- **Sin Error Boundary en todo el proyecto** (0 coincidencias): una excepción de render deja pantalla en blanco, sin recuperación ni telemetría.

**Pedagogía** — el núcleo del producto
- **Sin repetición espaciada.** `QuizManager.jsx:89-101` reintenta la palabra fallada en el mismo turno y luego la olvida para siempre. En una app de vocabulario, es el mecanismo que separa "hacer un quiz" de "aprender".
- **Feedback sin contenido.** `SentenceBuilder.jsx:187` dice `"INCORRECTO"`; `ListeningChallenge.jsx:287` dice `"¡Ups! Inténtalo de nuevo."`. Nunca se muestra la respuesta correcta ni el orden correcto. El error no se convierte en aprendizaje.
- **El fallo del Oráculo es silencioso.** `OracleChat.jsx:260-264`: el "Pensando…" desaparece sin toast, sin burbuja de error, sin reintento.
- **Chat IA sin guardrails visibles** en un producto de uso escolar con menores: solo restricciones pedagógicas en el prompt (`OracleChat.jsx:141-153`), sin filtro de contenido, aviso de IA ni mecanismo de reporte.

**Móvil**
- El juego no tiene controles táctiles ni detección de dispositivo incompatible (`GamePage.jsx:652-665`).
- `OracleChat.jsx:306` usa `h-[700px]` fijo dentro de un `h-[90vh]` (`GamePage.jsx:692`): en 390×844 con la barra del navegador el contenido queda cortado arriba y abajo.
- `public/game/index.html:5` incluye `user-scalable=no` → zoom bloqueado (WCAG 1.4.4). El `index.html` raíz está bien.
- `vh` en lugar de `dvh` en overlays (`GamePage.jsx:692`, `StudentProfileModal.jsx:60`).
- Formularios de auth sin `autoComplete` ni `inputMode` (`LoginPage.jsx:96,111`, `RegisterPage.jsx:100,116,133,150`): sin teclado de email optimizado y sin autofill de gestores de contraseñas.
- `ui/Dialog.jsx:59` no tiene `max-h` ni `overflow-y-auto`: contenido largo se desborda sin scroll.

---

## P2 — Consistencia y deuda

- **Ausencia casi total de ARIA:** 3 coincidencias de `aria-` en todo `src/`, dos de ellas en `ThemeButton.jsx` y `RandomWordCard.jsx`.
- **Sin `<main>`** en 7 de 11 vistas → sin "saltar al contenido".
- **`focus:outline-none` 35 veces**, con dos casos sin ninguna compensación (`Navbar.jsx:170`, `ListeningChallenge.jsx:276`). Ratio `focus:` 100 vs `focus-visible:` 8.
- **`prefers-reduced-motion` implementado en 1 solo componente** (`TextShuffle.jsx:76`) frente a confetti, GSAP, sprites en bucle infinito y tours de driver.js con `animate: true` fijo.
- **6 spinners sin `role="status"`/`aria-live`** — el texto "CARGANDO…" existe visualmente pero no se anuncia.
- **289 clases Tailwind con valores arbitrarios** (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` repetido literal en 6+ sitios de `GamePage.jsx`): explican buena parte de los 104 KB de CSS.
- **Escalas ausentes:** 20+ usos de `text-[10px]`/`[9px]`/`[8px]` sin escala tipográfica; `z-0 → z-[100]` sin escala de capas (`z-[60]`, `z-[70]`, `z-[100]` compitiendo con `z-50` por tanteo); alturas mágicas incluida `h-[2000px]` en `BadgesPage.jsx`.
- **`ThemeButton.jsx:10`** referencia `var(--color-bg-tertiary)`, **variable inexistente** → anillo de foco sin color.
- **`Sonner.jsx:39`** fuerza `!text-black`: ilegible en cuanto exista el modo oscuro.
- **`ui/Dialog.jsx:70,107`** dice `"Close"` en inglés, incluido el `sr-only`.
- **`ProfilePage.jsx:679`** muestra `LEGENDARY`/`EPIC`/`RARE` en crudo mientras `BadgesPage.jsx:10-40` sí los traduce: el mismo dato, dos pantallas, dos idiomas.
- **Typo doble en el Oráculo:** `"BUCANDO RESPUESTA EN LOS ASTROS…"` (`OracleChatDictionary.jsx:127`) mostrado **simultáneamente** con `"ESPERANDO A LOS ASTROS…"` (línea 180) para la misma espera.
- **Etiquetas divergentes por breakpoint:** "LOGIN/REGISTRO" en desktop vs "INICIAR SESIÓN/REGISTRARSE" en móvil (`Navbar.jsx:215,221,287,290`); "PANEL OP" vs "PANEL ADMIN" (`AdminDashboard.jsx:95,135`).
- **Errores de DRF crudos hacia el profesor:** `BadgesAdminPanel.jsx:213-231`, `DictionaryAdminPanel.jsx:153-164`. Y `DictionaryAdminPanel.jsx:505` expone `ex1_en, ex1_es…` como instrucción para un docente no técnico.
- **`FarmDetail.jsx:44`** usa `window.confirm()` nativo mientras las otras 4 eliminaciones usan modal propio. Ninguna advierte del efecto en cascada sobre alumnos que ya tienen la insignia/avatar asignado.
- **`DashboardStatsCards.jsx`** mezcla `useAxios` y `axios` plano en el mismo archivo: la segunda llamada va sin `Authorization` ni refresh automático.
- **Sin tests, sin TypeScript, sin PropTypes.** Cero dependencias de testing. Con componentes de 800 líneas y una condición de carrera en el refresh de token, cualquier refactor de `AuthContext`/`useAxios` es a ciegas.
- **21 `console.log`/`console.error`** en producción, ninguno tras `import.meta.env.DEV`, algunos con el objeto de usuario decodificado (`AuthContext.jsx:97`).
- **Código muerto:** `RandomWordCard.jsx` (no importado), `DropdownLenguage.jsx` (no importado), `LenguageContext.jsx` (0 bytes), `views/Dashboard.jsx` (huérfano).
- **Antipatrones del detector:** 6 bordes de acento lateral (`border-l-4`/`border-r-4` en `AdminDashboard.jsx:133`, `WordTypesSection.jsx:97,98,117`, `BadgesPage.jsx:232,238`, `GamePage.jsx:473`) y 4 `animate-bounce` (easing elástico, `QuizManager.jsx:137`, `SentenceBuilder.jsx:186`, `ListeningChallenge.jsx:287`, `GamePage.jsx:726`).

---

# Plan de trabajo

Orden pensado para que cada fase deje el terreno preparado para la siguiente y para no refactorizar dos veces lo mismo.

## Fase 0 — Incidente de seguridad · hoy, 2-4 h

Bloquea el resto. No tiene sentido optimizar un bundle que regala claves.

1. Revocar la clave de ElevenLabs y el PAT de GitHub en sus consolas.
2. Crear 3 endpoints proxy en Django (`/api/tts/`, `/api/oracle/`, `/api/word-suggestion/`) con `IsAuthenticated` + throttling. Reutilizar el patrón de `/game/oracle/`.
3. Migrar `ListeningChallenge.jsx:41,148`, `DictionaryPage.jsx:384`, `OracleChat.jsx:21-22`, `WordSuggestionModal.jsx:29` a esos endpoints.
4. `npm uninstall @elevenlabs/elevenlabs-js`. Vaciar `.env` de las 6 claves y quitar el prefijo `VITE_` a las dos sin usar.
5. Borrar `index.html:11` (`js.puter.com`).
6. Confirmar en Vercel que ninguna env var de servidor se inyecta como `VITE_*` en el pipeline.

**Verificación:** `npm run build && grep -cE 'sk_|xi-api-key|ghp_|github_pat_' dist/assets/*.js` → 0.

## Fase 1 — Quick wins · 1 día

Todo de esfuerzo trivial-bajo, sin refactor.

| Acción | Ubicación | Ganancia |
|---|---|---|
| Quitar `@import` de Google Fonts | `index.css:1` | 1 request bloqueante menos |
| `npm uninstall react-data-table-component` | `package.json` | ~140 KB de dependencia muerta |
| `useMemo` en los `value` de contexto | `AuthContext.jsx:274`, `ThemeContext.jsx:24` | Fin del re-render global cada 4 min |
| Mover `CHARACTERS`/`UPGRADES` fuera del componente | `GamePage.jsx:43-93` | ~20 objetos menos por render |
| `color-mix()` en lugar de `rgba(var(--primary),…)` | 8 sitios | Arregla sombras que nunca se pintaron |
| `loading="lazy"` + `width`/`height` en los 24 `<img>` | varios | Menos CLS, descargas diferidas |
| `background.jpg` → WebP/AVIF con `<picture>` | 174 KB | ~50-70 KB |
| Quitar `user-scalable=no` | `public/game/index.html:5` | WCAG 1.4.4 |
| `autoComplete` + `inputMode` en auth | `LoginPage.jsx:96,111`, `RegisterPage.jsx:100,116,133,150` | Autofill y teclado correcto en móvil |
| `vh` → `dvh` en overlays | `GamePage.jsx:692`, `StudentProfileModal.jsx:60` | Deja de cortarse bajo la barra del navegador |
| `max-h-[85dvh] overflow-y-auto` en `DialogContent` | `ui/Dialog.jsx:59` | Contenido largo scrollea |
| Registrar `/forgot-password` o quitar el enlace | `LoginPage.jsx:151` | Elimina enlace muerto |
| Descomentar la barra de progreso del quiz | `QuizManager.jsx:196-205` | El usuario ve cuánto queda |
| Borrar `views/Dashboard.jsx`, `RandomWordCard.jsx`, `LenguageContext.jsx` vacío | — | Menos código muerto y un bug menos |
| `console.*` tras `import.meta.env.DEV` o fuera | 21 sitios | Deja de filtrar datos de sesión |
| Traducir `"Close"` → `"Cerrar"`, arreglar `"BUCANDO"`, unificar el doble spinner del Oráculo | `Dialog.jsx:70,107`, `OracleChatDictionary.jsx:127,180` | Coherencia |

## Fase 2 — Rendimiento estructural · 2-3 días

1. `React.lazy` + `<Suspense fallback={<LoadingScreen/>}>` en todas las rutas de `App.jsx`. Prioridad: `AdminDashboard` (con sus 6 paneles), `GamePage`, `DictionaryPage`, `ProfilePage`, `QuizPage`, `BadgesPage`.
2. `manualChunks` en `vite.config.js`: `vendor_react`, `vendor_charts`, `vendor_dnd`, `vendor_gsap`. Añadir `build.target: 'es2020'` y `rollup-plugin-visualizer` como script de análisis.
3. Precargar `index.wasm` e `index.pck` con `<link rel="preload" as="fetch">` durante la pantalla `SELECTION`, más overlay de progreso propio en React y un `onError` + timeout en el iframe.
4. `AbortController` en `DictionaryPage.jsx:148-158` y en el cambio de pestaña de `ProfilePage.jsx:137-143`.
5. Extraer las sombras pixel repetidas a `@layer utilities` (`.shadow-pixel-sm/md/lg`) y eliminar las variantes arbitrarias.

**Objetivo medible:** chunk inicial **< 800 KB**, CSS **< 60 KB**, y una barra de progreso real durante la descarga del juego.

## Fase 3 — Theming y sistema de diseño · 3-5 días

Antes de tocar accesibilidad, porque migrar 95 botones a mano a un `Button` accesible resuelve ambas cosas de una pasada.

1. Elegir **un** sistema de tema. Recomendado: `next-themes` como único proveedor (trae el script anti-FOUC), borrar `ThemeContext.jsx` y el `ThemeButton` propio. Alternativa: quedarse con el `ThemeContext` propio y desinstalar `next-themes` — pero entonces `Sonner.jsx:1` necesita otro origen del tema.
2. Añadir `@custom-variant dark (&:where(.dark, .dark *));` y el bloque `.dark { … }` en `index.css`, con la paleta invertida. Sin esto, todo `dark:` que se escriba seguirá siendo inerte.
3. Arquitectura de tokens en tres capas:
   - **Primitivos** — `--pixel-green-500`, `--pixel-gold-500`, `--pixel-parchment-300`, `--space-tile-*`, `--border-pixel-1/2`, `--shadow-pixel-sm/md/lg`, `--z-0…--z-100`.
   - **Semánticos** — `--color-background/foreground/surface/brand/accent`, más los que hoy faltan y se suplen con literales: `--color-success/warning/danger/info`, `--color-difficulty-easy/medium/hard`, y la escala de capas `--z-navbar/dropdown/modal/modal-nested/toast/loading-overlay`.
   - **De componente** — `--button-pixel-shadow-rest`, `--card-pixel-padding`, `--modal-max-height`. Solo los leen los componentes de `ui/`.
   Regla de gobierno: `views/*` consume únicamente la capa semántica. Nunca primitivos, nunca color crudo de Tailwind.
4. Reescribir `ui/Button` y `ui/Card` con la identidad pixel por defecto (`rounded-none`, borde duro, sombra escalonada de `.pixel-btn`) y migrar los 95 botones manuales. Es el trabajo más grande de la fase y el que más deuda cancela.
5. Reemplazar los 265 colores crudos, empezando por el semáforo de `ProfilePage.jsx:18,21` y los 31 de `GamePage.jsx`.
6. Definir la escala tipográfica (`text-2xs`, `text-3xs` vía `@theme`) y erradicar los `text-[Npx]`.
7. Fijar la regla de fuentes: `font-mono` (Press Start 2P) solo para títulos y cifras cortas; `font-sans` (VT323) para cuerpo. Hoy `ProfilePage` va 52 a 1 en favor de la display, que a tamaño pequeño no se lee.
8. Arreglar `ThemeButton.jsx:10` (variable inexistente) y `Sonner.jsx:39` (`!text-black`).
9. Retirar los 6 `border-l-4`/`border-r-4` de acento lateral y sustituir los 4 `animate-bounce` por easing exponencial.

## Fase 4 — Accesibilidad · 3-4 días

1. Migrar los 6 modales a `ui/Dialog` (Radix). Cierra de golpe P0.3, el focus trap, el Escape, el retorno de foco y el bloqueo de scroll.
2. Convertir la selección de personaje (`GamePage.jsx:413-457`) en `<button>` real con `aria-pressed`/`aria-disabled`.
3. Transcripción opcional en `ListeningChallenge`, y sustituir los dos `alert()` nativos por UI propia con `role="alert"`.
4. `<label htmlFor>` + `aria-invalid` + `aria-describedby` + `role="alert"` en los errores de `LoginPage`, `RegisterPage` y `WordSuggestionModal`.
5. Envolver cada vista en `<main id="main-content">` y añadir enlace "saltar al contenido" en `Navbar`.
6. Hook `usePrefersReducedMotion()` aplicado a confetti, `SpriteAnimator`, `TextType` y `driver.js`.
7. `role="status" aria-live="polite"` en los 6 spinners; `aria-live` con "Pregunta X de Y" en `QuizManager`; instrucciones y live region en `SentenceBuilder`.
8. `aria-expanded`/`aria-haspopup` en los dropdowns de `Navbar`; `aria-hidden` en los iconos decorativos de `PixelIcons`.
9. Sustituir los 35 `outline-none` por `focus-visible:ring-2 ring-primary ring-offset-2`; subir los objetivos táctiles de `FarmDetail.jsx:153-166` y `Navbar.jsx:227` a 44×44 px.
10. Añadir `eslint-plugin-jsx-a11y` para que no reaparezca.

## Fase 5 — Flujo y pedagogía · 1-2 semanas

Aquí está el valor de producto, no solo la higiene.

1. **Arreglar la conversión:** el CTA de `HeroSection.jsx:74` va a `/register` si no hay sesión, a `/play` si la hay.
2. **Construir el dashboard real** y que `AuthContext.jsx:93-95` aterrice ahí tras el login: racha, siguiente palabra, progreso, un CTA claro. Hoy el usuario cae en la landing de marketing.
3. **Tour de primer uso con driver.js en ese aterrizaje**, no solo en Dictionary/Profile/Game.
4. **Repetición espaciada.** La pieza que convierte esto en una app de aprendizaje: persistir las palabras falladas con su intervalo de repaso y darles prioridad en la selección de `QuizManager.jsx:58-66`. Requiere modelo y endpoint en el backend — planificarlo con ese equipo.
5. **Feedback que enseñe:** mostrar la respuesta correcta y su significado tras un fallo en los tres tipos de reto (`MultiChoice`, `ListeningChallenge:287`, `SentenceBuilder:187`).
6. **Estados vacíos y de error diferenciados:** separar "sin resultados de búsqueda" de "aún no has descubierto palabras" (`DictionaryPage.jsx:264`); dejar de disfrazar los fallos de red de falta de contenido (`QuizPage.jsx:32-35`) y ofrecer "Reintentar".
7. **Toast de error y reintento en el Oráculo** (`OracleChat.jsx:260-264`).
8. **Un solo mensaje de sesión expirada**, que diga qué se perdió y ofrezca volver.
9. **`CheckEmailPage`:** comprobar el estado real de verificación y ofrecer reenvío del correo.
10. **Salida del juego controlada por React** durante `PLAYING`, sin depender del puente a Godot.
11. **Aviso de dispositivo incompatible** antes de montar el iframe, con alternativa al quiz. O controles táctiles, si el juego se quiere jugable en móvil.
12. **Uso escolar con menores:** aviso de IA y mecanismo de reporte en los dos chats del Oráculo; confirmar con el backend que hay moderación de contenido.
13. **Copy del panel admin:** dejar de mostrar errores de DRF en crudo, traducir la instrucción del CSV y añadir "Descargar plantilla", unificar `window.confirm` con el modal propio, advertir del efecto en cascada al borrar.

## Fase 6 — Arquitectura y red de seguridad · continuo

1. **Un solo mecanismo de refresh de token** con promesa compartida, más interceptor de *response* para el 401. Mover el refresh token a cookie `httpOnly` cuando el backend lo soporte.
2. **Vitest + React Testing Library**, con la primera cobertura sobre `AuthContext` y `useAxios` — precisamente porque tienen la condición de carrera y hoy cualquier cambio ahí es a ciegas.
3. **Error Boundary** de app en `App.jsx`, más uno por ruta en `GamePage` y `ProfilePage`. Ruta `*` con un 404 de verdad.
4. **TanStack Query** para caché, dedupe e invalidación: elimina la mitad de los ~40 `useState` de loading/error/data repartidos entre `ProfilePage` (24) y `GamePage` (19).
5. **Descomponer** `GamePage` (820), `ProfilePage` (739), `BadgesAdminPanel` (611), `DictionaryAdminPanel` (548) en hooks + subcomponentes, apoyándose en la caché del punto anterior.
6. **Unificar `OracleChat` y `OracleChatDictionary`** sobre el patrón proxy del segundo; extraer `useAnswerValidation` compartido para los tres retos del quiz (hoy `checkAnswer` está reimplementado tres veces con normalizaciones distintas).
7. **Implementar `LenguageContext` de verdad** o retirar el selector de idioma. Un producto para aprender inglés con un switcher decorativo es peor que no tenerlo. Empezar por `translateError` de `AuthContext.jsx:57-72`, ya centralizado.
8. **Endurecer ESLint:** `jsx-a11y`, límite de líneas por archivo, y quitar el `varsIgnorePattern: '^[A-Z_]'` que permite dejar componentes importados sin usar.
9. **`<title>` por ruta y scroll restoration** en la navegación.

---

## Riesgo si no se actúa

| Fase omitida | Consecuencia |
|---|---|
| 0 | Facturación de terceros a cargo de cualquier visitante; posible escritura en el repo de GitHub |
| 2 | 3.8 MB de descarga inicial: en 3G la app es inusable y el juego parece roto |
| 3 | Cada pantalla nueva añade deuda; el modo oscuro seguirá siendo una promesa incumplida en la UI |
| 4 | Producto educativo excluyente: inaccesible por teclado y con un tipo de reto cerrado a usuarios sordos |
| 5 | El bucle de aprendizaje no retiene: sin repaso ni explicación del error, el quiz es un juego, no un método |

---

## Lo que ya está bien

No todo es deuda, y conviene no romperlo al refactorizar:

- **Los tokens semánticos de `index.css` son una base correcta** (patrón HSL tipo shadcn) — el problema es que el código no los respeta, no el diseño de los tokens.
- **La landing tiene identidad propia y consistente**: consume tokens, usa `pixel-border*` y animaciones a medida. Es la referencia visual a la que debe alinearse el app shell.
- **`AdminDashboard.jsx:130-153` tiene un drawer móvil real** con overlay — poco común en paneles de administración.
- **`SentenceBuilder` usa `PointerSensor` + `touch-none`**: el drag & drop funciona correctamente en táctil, que es justo lo que suele fallar con `@dnd-kit`.
- **`DictionaryAdminPanel.jsx:288`** usa `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` — acciones visibles por defecto en touch, ocultas solo en desktop. Patrón correcto.
- **`ProfilePage`, `DictionaryPage`, `BadgesPage`, `QuizPage` son responsive de verdad**, con grids y tabs bien resueltos.
- **`DashboardStatsCards.jsx:7` ya demuestra el patrón `lazy()`** que hay que replicar en las rutas.
- **`OracleChatDictionary.jsx` ya llama al backend correctamente** — es el patrón a copiar en la Fase 0, no hay que inventarlo.
- **La verificación de permisos admin sí existe en el backend** (`IsAdminUser` en `api/views.py:178,252,373,395,427,470`): el gate del cliente es solo UX, no la única defensa. Mantener esa invariante documentada.
- **`.env` no está comiteado** y `.gitignore` es correcto: la fuga de secretos es por diseño (`VITE_*`), no por un commit accidental.
- **`TextShuffle.jsx:76` respeta `prefers-reduced-motion`**: ya existe el patrón a generalizar.
- **`.pixel-btn:hover/:active` en `index.css:127-137`** define un lenguaje de estados coherente y bien pensado. Es lo que `ui/Button` debería haber adoptado desde el principio.
