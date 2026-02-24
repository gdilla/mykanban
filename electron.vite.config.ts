import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      lib: {
        entry: 'src/main.js'
      }
    }
  },
  preload: {
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: 'src/preload.js'
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer'
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer')
      }
    }
  }
})
