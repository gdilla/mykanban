import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src/renderer') } },
  test: { include: ['src/**/*.test.{ts,tsx,js,mjs}'], setupFiles: ['./vitest.setup.ts'] },
})
