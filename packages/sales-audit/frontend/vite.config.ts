import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BASE_API || 'http://localhost:3007'

  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
    },
  }

  return {
    // Served under a path prefix (e.g. /sales-audit/) behind nginx in production.
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: { port: 5179, proxy },
    // nginx forwards the public Host header, which vite would otherwise reject.
    preview: { proxy, allowedHosts: true },
  }
})
