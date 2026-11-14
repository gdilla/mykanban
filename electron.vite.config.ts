import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The Content-Security-Policy in src/renderer/index.html is the production policy. The dev server
// needs two exceptions: the React refresh preamble is an inline script, and hot reload uses a websocket.
const devCsp = {
  name: 'dev-csp',
  apply: 'serve' as const,
  transformIndexHtml(html: string) {
    const strict = /script-src 'self' 'sha256-[^']+'/
    if (!strict.test(html)) throw new Error('dev-csp: script-src in index.html changed, update electron.vite.config.ts')
    return html.replace(strict, "script-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:*")
  }
}

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
    plugins: [react(), devCsp],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer')
      }
    }
  }
})
