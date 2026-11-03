import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND || 'http://localhost:8082'
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      strictPort: true,
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true, headers: { origin: 'http://localhost:5173' } },
        '/ws': { target: backend, ws: true, changeOrigin: true, headers: { origin: 'http://localhost:5173' } }
      }
    }
  }
})