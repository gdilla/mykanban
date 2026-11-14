import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
      lib: {
        entry: 'src/main.js'
      },
      // main.js is CommonJS: without this its relative require()s (./dates) are left
      // unbundled and the built app cannot find them
      commonjsOptions: { include: [/src\/[^/]+\.js$/, /node_modules/] }
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
