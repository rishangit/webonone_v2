import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const uiKitRoot = path.resolve(__dirname, '../../ui-kit/package')
const platformNavRoot = path.resolve(__dirname, '../../packages/platform-nav')
const platformEmbedRoot = path.resolve(__dirname, '../../packages/platform-embed')
const themeRoot = path.resolve(__dirname, '../../packages/theme')
const storeKitRoot = path.resolve(__dirname, '../../packages/store-kit')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const webononeOrigin = env.VITE_WEBONONE_ORIGIN ?? 'http://localhost:3010'
  const identityOrigin = env.VITE_IDENTITY_ORIGIN ?? 'http://localhost:3011'

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
        { find: '@webonone/store-kit', replacement: path.join(storeKitRoot, 'src/index.ts') },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
    },
    server: {
      port: 3014,
      strictPort: true,
      headers: {
        'Content-Security-Policy': `frame-ancestors 'self' ${webononeOrigin} ${identityOrigin}`,
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
