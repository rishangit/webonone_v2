import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const uiKitRoot = path.resolve(__dirname, '../../ui-kit/package')
const themeRoot = path.resolve(__dirname, '../../packages/theme')
const i18nRoot = path.resolve(__dirname, '../../packages/i18n')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@webonone/ui-kit/styles', replacement: path.join(uiKitRoot, 'src/styles/globals.css') },
      { find: '@webonone/ui-kit/tailwind', replacement: path.join(uiKitRoot, 'tailwind.config.ts') },
      { find: '@webonone/ui-kit', replacement: path.join(uiKitRoot, 'src/index.ts') },
      { find: '@webonone/theme', replacement: path.join(themeRoot, 'src/index.ts') },
      { find: '@webonone/i18n', replacement: path.join(i18nRoot, 'src/index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 3021,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('mdast')) {
            return 'vendor-markdown'
          }
        },
      },
    },
  },
})
