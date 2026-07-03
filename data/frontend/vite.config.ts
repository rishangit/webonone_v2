import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const uiKitRoot = path.resolve(__dirname, '../../ui-kit/package')
const platformNavRoot = path.resolve(__dirname, '../../packages/platform-nav')
const themeRoot = path.resolve(__dirname, '../../packages/theme')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@webonone/ui-kit/styles', replacement: path.join(uiKitRoot, 'src/styles/globals.css') },
      { find: '@webonone/ui-kit/tailwind', replacement: path.join(uiKitRoot, 'tailwind.config.ts') },
      { find: '@webonone/ui-kit', replacement: path.join(uiKitRoot, 'src/index.ts') },
      { find: '@webonone/platform-nav', replacement: path.join(platformNavRoot, 'src/index.ts') },
      { find: '@webonone/theme', replacement: path.join(themeRoot, 'src/index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  server: {
    port: 3005,
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' http://localhost:3000 http://localhost:3001",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/features/tags/')) return 'feature-tags'
            if (id.includes('/features/units/')) return 'feature-units'
            if (id.includes('/features/attributes/')) return 'feature-attributes'
            if (id.includes('/features/products/') || id.includes('/features/catalog/')) return 'feature-catalog'
            if (id.includes('/features/services/')) return 'feature-services'
            if (id.includes('/features/spaces/')) return 'feature-spaces'
            if (id.includes('/features/dashboard/')) return 'feature-dashboard'
            return
          }
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('@radix-ui')) return 'vendor-radix'
        },
      },
    },
  },
})
