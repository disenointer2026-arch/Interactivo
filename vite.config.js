import { defineConfig } from 'vite'

// src/    → código fuente (HTML, CSS, JS)
// static/ → archivos que se copian tal cual (modelos .glb, texturas, imágenes, audio)
export default defineConfig({
  root: 'src/',
  publicDir: '../static/',
  base: './',
  server: {
    host: true,
    open: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  }
})
