import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/CursosWeb/',

  build: {
    // Mapbox vive en un chunk aislado y se carga solo al acercarse al mapa.
    chunkSizeWarningLimit: 1900,
  },

  plugins: [
    tailwindcss(),
    react(),
    babel({
      presets: [reactCompilerPreset()]
    })
  ]
})
