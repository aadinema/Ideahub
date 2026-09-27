import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Standalone Vitest config (kept separate from vite.config.js, whose function
// form loads env for the dev proxy). Aliases must mirror vite.config.js and
// jest.setup.js isolation assumptions.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared/constants': fileURLToPath(new URL('./src/constants.js', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    globals: false,
  },
})
