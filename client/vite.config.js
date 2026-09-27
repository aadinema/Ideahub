import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

// Fallback must match server/server.js (`process.env.PORT || 5000`).
const DEFAULT_API_PORT = 5000

export default defineConfig(({ mode }) => {
  // Single env-controlled value: VITE_API_PORT (client/.env). Also read the backend
  // PORT so the dev proxy and the API server can't silently drift. Separate prefixes
  // keep server secrets out of the Vite process.
  const clientEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const serverEnv = loadEnv(mode, resolve(process.cwd(), '../server'), 'PORT')
  const apiPort = clientEnv.VITE_API_PORT || serverEnv.PORT || DEFAULT_API_PORT

  if (
    clientEnv.VITE_API_PORT &&
    serverEnv.PORT &&
    String(clientEnv.VITE_API_PORT) !== String(serverEnv.PORT)
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `\n[vite] ⚠ Port mismatch: client/.env VITE_API_PORT=${clientEnv.VITE_API_PORT} ` +
        `but server/.env PORT=${serverEnv.PORT}. Proxy will target :${apiPort}.\n`
    )
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared/constants': fileURLToPath(new URL('./src/constants.js', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
