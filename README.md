# 📖 Misspelt

<div align="center">
  <img src="./frontend/public/game/skins/mage.png" alt="Mage" width="100"/>
  <h3>Aprende Inglés Sobreviviendo a la Ortografía</h3>
  <p>Misspelt es un videojuego web <strong>Roguelite / Survivor</strong> que combina acción frenética de disparos en 2D (estilo <i>Vampire Survivors</i>) con módulos educativos de inglés para poner a prueba y mejorar tu vocabulario, gramática y modismos.</p>
</div>

---

## 🎮 ¿Qué es Misspelt?

En **Misspelt**, tomas el control de diferentes héroes mágicos en un universo pixel-art donde el lenguaje ha sido corrompido. Hordas de **Cosas Mal Escritas** (letras y palabras incorrectas) te atacarán para destruirte.

Para sobrevivir, tendrás que:

1. **Evadir y Atacar (Survivor Mode):** Usa magia para destruir letras y jefes. Recoge experiencia (XP) para subir de nivel en tiempo real y desbloquear poderosas mejoras exclusivas de cada personaje (Multi-cast, Auras oscuras, etc.).
2. **Aprender y Asimilar (Quiz Mode):** Eventualmente, entrarás en modo "Concentración". Aquí, pausas el tiempo para asimilar listas de palabras respondiendo mini-quizzes de Vocabulario, Modismos (Idioms) o Phrasal Verbs. Si aciertas, absorbes su conocimiento y obtienes mucha experiencia.

Al final de cada sesión, regresas a la base con estadísticas que miden cuánto inglés has asimilado realmente a lo largo del tiempo.

---

## ✨ Características Principales

- **🎮 Gameplay Dinámico 2D:** Construido con el motor [Godot](https://godotengine.org/). Controles y físicas fluidas, <i>spawn</i> procedural de enemigos y mecánicas de colisión intensas.
- **🧠 Módulos Educativos con Niveles de Dificultad:** Elige entre niveles de vocabulario (Easy, Normal, Hard). El juego escala orgánicamente integrando quizzes en medio de la acción.
- **🏆 Sistemas de Progresión (RPG):** Los usuarios ganan XP general y completan misiones para desbloquear Insignias (Badges), Títulos, Avatares y Nuevos Personajes Jugables (cada uno con su propio árbol de habilidades).
- **📊 Panel de Estadísticas Detalladas:** Revisa un historial pormenorizado de cuántas palabras has aprendido, tu porcentaje de precisión en los tests y tus rachas diarias (Daily Streaks).
- **👑 Panel de Administración Completo:** Herramientas personalizadas en el frontend para gestionar la comunidad, moderar palabras, aprobar nuevas trivias y administrar insignias y eventos.

---

## 🛠️ Stack Tecnológico

La arquitectura está diseñada para ser ultra-rápida, segura y escalable.

### 🌐 Frontend (Web App & UI)

La cara visible de la aplicación, responsable del panel de usuario y menús.

- **[React](https://react.dev/) + [Vite](https://vitejs.dev/):** Para una SPA rápida y un entorno de desarrollo instantáneo.
- **[Tailwind CSS](https://tailwindcss.com/):** Manejo absoluto del diseño visual con estilos utilitarios y soporte directo de clases arbitrarias.
- **[shadcn/ui](https://ui.shadcn.com/):** Componentes base de accesibilidad refinada.
- **Autenticación (JWT):** Gestión de inicio de sesión persistente e integración con **Google Sign-In** para onboarding fluido.
- **[Driver.js](https://driverjs.com/):** Integración de tutoriales dinámicos interactivos sobre los componentes de la interfaz.

### ⚙️ Backend (API y Servidor)

La base de datos y la lógica pesada del servidor.

- **[Python](https://www.python.org/) + [Django](https://www.djangoproject.com/):** Framework principal.
- **[Django REST Framework (DRF)](https://www.django-rest-framework.org/):** Para crear y servir toda la API (modelos, controladores y enrutamiento serializado).
- **SQLite / PostgreSQL:** Motor de bases de datos relacionales para manejar perfiles, estadísticas complejas de usuarios e inventarios (avatares, insignias).
- **Autenticación SimpleJWT:** Manejo cifrado de tokens de acceso y refresco.
- **OAuth2:** Lógica para la validación y canje de tokens con Google.

### 🕹️ Motor del Juego (Game Client)

La magia que ocurre cuando le das a "Empezar Partido".

- **[Godot Engine 4 (GDScript)](https://godotengine.org/):** Motor gratuito y open-source con el que se diseñó la lógica 2D de movimiento, colisiones, Spawners, IA de enemigos (letras y Jefes), Parallax Backgrounds y animaciones de partículas.
- **Exportación HTML5:** El juego se exporta directamente a Canvas/WebAssembly y se monta y comunica con React mediante `<iframe>` y la API `postMessage()` u objetos globales (JavaScript Bridge).

---

## 📂 Estructura del Proyecto

El repositorio está claramente separado en dos monolitos principales, más la carpeta del juego:

```text
/Misspelt/Game/
├── backend/                  # Código del Servidor (Django)
│   ├── api/                  # App principal: v1 API Endpoints, Modelos de Base de Datos, Logica AI
│   ├── core/                 # Configuracion raiz de Django (settings.py, middlewares)
│   └── manage.py             # Script de administracion python
│
├── frontend/                 # Archivos SPA (React / Vite)
│   ├── public/               # Assets estaticos y Exportacion compilada de Godot (`/game/`)
│   └── src/
│       ├── components/       # Componentes reusables de React (Botones, Paneles, Modals)
│       ├── context/          # Manejadores globales de Estado (AuthContext)
│       ├── views/            # Paginas enteras (Landing, GamePage, ProfilePage, AdminDashboard)
│       └── utils/            # Hooks, axios interceptors, validadores.
│
└── godot_project/         # (Solo si se requiere acceso a la build cruda) Escenas, Nodos, GDScripts.
```

---

## 🚀 Instalación y Desarrollo Local

Clona el repositorio e inicializa los dos entornos al mismo tiempo para desarrollo local:

### 1️⃣ Levantar el Backend (Django)

Asegúrate de tener Python instalado y crea un entorno virtual (venv) para dependencias.

```bash
cd backend
python -m venv venv
# Activa el venv (Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate)

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate

# El SSL/HTTPS local es mandatorio para Web Crypto y Google Auth:
python run_https_server.py runserver
```

_(El backend levanta por defecto en `https://127.0.0.1:8000`)_

### 2️⃣ Levantar el Frontend (React)

Abre otra terminal y entra a la carpeta frontend.

```bash
cd frontend
npm install

# Levantar entorno Dev
npm run dev
```

_(El frontend levanta por defecto en `http://localhost:5173` o lo que Vite decida)_

💡 **NOTA:** Si compilas el juego de Godot nuevamente, asegúrate de sobreescribir los archivos HTML/JS/WASM en la carpeta `frontend/public/game/` para que el cliente web tome la nueva versión.

---

## 🔒 Autenticación e Interacción Game ↔ Web

- **Google Sign-In (`@react-oauth/google`)**: Usamos la ventana de pop-up de Oauth2. El token se envía al backend DRF para ser validado nativamente, retornando el Access/Refresh token nuestro. _(Nota de desarrollo: requiere CORS headers ajustados a `Cross-Origin-Opener-Policy: same-origin-allow-popups` localmente)_.
- **Comunicación**: El juego (Godot) y la Web (React) no están pegados 100%. Godot envía señales mediante `JavaScriptBridge` a React (ej: _“¡Hola web, el jugador completó el mundo y ganará xp!”_). React escucha el llamado, muestra la interfaz UI superpuesta moderna (suspendiendo momentáneamente el juego) y envía al backend una petición de actualización. Esto maximiza el performance permitiendo a Godot dedicarse sólo a renderizar y a React dedicarse al estado del DOM.

---

> Hecho con píxeles, magia y un diccionario roto. 💙
