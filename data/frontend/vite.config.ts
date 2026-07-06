import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

const configDir = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(configDir, 'src')
const uiKitRoot = path.resolve(configDir, '../../ui-kit/package')
const platformNavRoot = path.resolve(configDir, '../../packages/platform-nav')
const platformEmbedRoot = path.resolve(configDir, '../../packages/platform-embed')
const themeRoot = path.resolve(configDir, '../../packages/theme')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, '')
  const webononeOrigin = env.VITE_WEBONONE_ORIGIN ?? 'http://localhost:3000'
  const identityOrigin = env.VITE_IDENTITY_ORIGIN ?? 'http://localhost:3001'

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@webonone/ui-kit/styles', replacement: path.join(uiKitRoot, 'src/styles/globals.css') },
        { find: '@webonone/ui-kit/tailwind', replacement: path.join(uiKitRoot, 'tailwind.config.ts') },
        { find: '@webonone/ui-kit', replacement: path.join(uiKitRoot, 'src/index.ts') },
        { find: '@webonone/platform-nav', replacement: path.join(platformNavRoot, 'src/index.ts') },
        { find: '@webonone/platform-embed', replacement: path.join(platformEmbedRoot, 'src/index.ts') },
        { find: '@webonone/theme', replacement: path.join(themeRoot, 'src/index.ts') },
        { find: /^@\//, replacement: `${srcDir}/` },
      ],
    },
    server: {
      port: 3005,
      headers: {
        'Content-Security-Policy': `frame-ancestors 'self' ${webononeOrigin} ${identityOrigin}`,
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
  }
})
