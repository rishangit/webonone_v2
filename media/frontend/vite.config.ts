import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

const configDir = path.dirname(fileURLToPath(import.meta.url))
const uiKitRoot = path.resolve(configDir, '../../ui-kit/package')
const platformNavRoot = path.resolve(configDir, '../../packages/platform-nav')
const platformEmbedRoot = path.resolve(configDir, '../../packages/platform-embed')
const mediaEmbedRoot = path.resolve(configDir, '../../packages/media-embed')
const themeRoot = path.resolve(configDir, '../../packages/theme')
const storeKitRoot = path.resolve(configDir, '../../packages/store-kit')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, '')
  const allowedParentOrigins =
    env.VITE_ALLOWED_PARENT_ORIGINS ??
    'http://127.0.0.1:3010,http://127.0.0.1:3011,http://127.0.0.1:3012,http://127.0.0.1:3013,http://127.0.0.1:3015'
  const frameAncestors = ["'self'", ...allowedParentOrigins.split(',').map((entry) => entry.trim()).filter(Boolean)]
    .filter((value, index, list) => list.indexOf(value) === index)
    .join(' ')

  return {
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@webonone/ui-kit/styles', replacement: path.join(uiKitRoot, 'src/styles/globals.css') },
        { find: '@webonone/ui-kit/tailwind', replacement: path.join(uiKitRoot, 'tailwind.config.ts') },
        { find: '@webonone/ui-kit', replacement: path.join(uiKitRoot, 'src/index.ts') },
        { find: '@webonone/platform-nav', replacement: path.join(platformNavRoot, 'src/index.ts') },
        { find: '@webonone/platform-embed', replacement: path.join(platformEmbedRoot, 'src/index.ts') },
        { find: '@webonone/media-embed', replacement: path.join(mediaEmbedRoot, 'src/index.ts') },
        { find: '@webonone/theme', replacement: path.join(themeRoot, 'src/index.ts') },
        { find: '@webonone/store-kit', replacement: path.join(storeKitRoot, 'src/index.ts') },
        { find: '@', replacement: path.resolve(configDir, './src') },
      ],
    },
    server: {
      host: '127.0.0.1',
      port: 3013,
      strictPort: true,
      headers: {
        'Content-Security-Policy': `frame-ancestors ${frameAncestors}`,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('@radix-ui')) return 'vendor-radix'
          },
        },
      },
    },
  }
})
