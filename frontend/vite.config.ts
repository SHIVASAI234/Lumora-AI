import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_TARGET = process.env.LUMORA_API ?? 'http://localhost:8787'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  server: {
    host: true,
    fs: { allow: ['..'] },
    proxy: {
      '/api': API_TARGET,
      '/ws': { target: API_TARGET.replace(/^http/, 'ws'), ws: true },
    },
  },
})
