import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_BASE_API || 'http://localhost:3002'
  const vendorTarget = env.VITE_VENDOR_API || 'http://localhost:3001'

  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
    },
    '/vendor-api': {
      target: vendorTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/vendor-api/, '/api'),
    },
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
