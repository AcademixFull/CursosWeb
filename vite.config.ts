import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { academixPwa } from './pwa'
import { buildIdentity } from './build-info'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: '/',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true, headers: { 'Cache-Control': 'no-cache' } },

  build: {
    // Mapbox vive en un chunk aislado y se carga solo al acercarse al mapa.
    chunkSizeWarningLimit: 1900,
  },

  plugins: [
    buildIdentity(),
    academixPwa(),
    tailwindcss(),
    react(),
    babel({
      presets: [reactCompilerPreset()]
    })
  ]
})
