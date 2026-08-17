import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
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
