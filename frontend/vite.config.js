import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Sirve los archivos del juego pre-comprimidos, en desarrollo.
 *
 * El export web de Godot deja `public/game/index.wasm` (~34 MB) y
 * `index.pck`. Medido contra este mismo servidor, la respuesta llegaba con
 * `content-length: 35739700` y sin `content-encoding`: el navegador se bajaba
 * los 34 MB enteros en cada arranque del juego, y el bundle completo pasaba de
 * 79 MB. El wasm comprime un 77% (34.1 MB -> 7.9 MB con brotli), asi que no
 * comprimirlo es tirar la mayor parte de la transferencia.
 *
 * No se comprime al vuelo: brotli sobre 34 MB se nota en cada recarga. Los
 * `.br`/`.gz` los genera `npm run comprimir-juego` tras cada exportacion, y
 * este plugin solo los elige si existen y si el navegador los acepta.
 *
 * En produccion `vite build` copia los `.br`/`.gz` a `dist/game/`, pero es el
 * servidor de estaticos quien tiene que servirlos: en nginx es
 * `brotli_static on; gzip_static on;`, y la mayoria de plataformas (Netlify,
 * Vercel, Cloudflare) lo hacen solas para .wasm. Si el host no lo hace, el
 * juego sigue funcionando: se sirve sin comprimir, solo mas lento.
 */
const servirJuegoComprimido = () => ({
  name: 'servir-juego-comprimido',
  apply: 'serve',
  configureServer(server) {
    const TIPOS = {
      '.wasm': 'application/wasm',
      '.pck': 'application/octet-stream',
      '.js': 'text/javascript',
      '.html': 'text/html',
    }

    server.middlewares.use((req, res, next) => {
      const ruta = (req.url || '').split('?')[0]
      if (!ruta.startsWith('/game/')) return next()

      const ext = path.extname(ruta)
      if (!TIPOS[ext]) return next()

      const aceptado = req.headers['accept-encoding'] || ''
      // Brotli primero: sobre el wasm gana ~1.6 MB frente a gzip.
      const codificacion = /\bbr\b/.test(aceptado) ? 'br' : /\bgzip\b/.test(aceptado) ? 'gzip' : null
      if (!codificacion) return next()

      const sufijo = codificacion === 'br' ? '.br' : '.gz'
      const archivo = path.join(__dirname, 'public', ruta.replace(/^\/game\//, 'game/') + sufijo)
      if (!fs.existsSync(archivo)) return next()

      const { size } = fs.statSync(archivo)
      res.setHeader('Content-Type', TIPOS[ext])
      res.setHeader('Content-Encoding', codificacion)
      res.setHeader('Content-Length', size)
      // `Vary` para que ninguna cache intermedia sirva la version comprimida a
      // un cliente que no la pidio.
      res.setHeader('Vary', 'Accept-Encoding')
      fs.createReadStream(archivo).pipe(res)
    })
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    servirJuegoComprimido(),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    https: {
      key: path.resolve(__dirname, '../backend/key.pem'),
      cert: path.resolve(__dirname, '../backend/cert.pem'),
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    // Con las rutas ya en React.lazy, esto separa las librerias grandes en
    // chunks propios: cambiar codigo de la app no invalida la cache del vendor.
    rollupOptions: {
      output: {
        // Solo se separan las librerias pesadas que ya viven detras de una ruta
        // lazy. React y el resto se dejan donde Rollup decida: forzarlos a un
        // chunk propio invierte el orden de ejecucion y el primer modulo que
        // llama a React.createContext lo encuentra undefined (pantalla en blanco).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (/[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/.test(id)) {
            return 'vendor_charts'
          }
          if (id.includes('node_modules/@dnd-kit/')) return 'vendor_dnd'
          if (/[\\/]node_modules[\\/](gsap|@gsap)[\\/]/.test(id)) return 'vendor_gsap'
          if (id.includes('node_modules/driver.js')) return 'vendor_tour'
          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
