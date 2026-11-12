import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { academixPwa } from './pwa'
import { buildIdentity } from './build-info'

export default defineConfig({
  base: '/CursosWeb/',
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
