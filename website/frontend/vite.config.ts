import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const uiKitRoot = path.resolve(__dirname, '../../ui-kit/package')
const themeRoot = path.resolve(__dirname, '../../packages/theme')
const platformNavRoot = path.resolve(__dirname, '../../packages/platform-nav')
const platformEmbedRoot = path.resolve(__dirname, '../../packages/platform-embed')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@webonone/ui-kit/styles', replacement: path.join(uiKitRoot, 'src/styles/globals.css') },
      { find: '@webonone/ui-kit/tailwind', replacement: path.join(uiKitRoot, 'tailwind.config.ts') },
      { find: '@webonone/ui-kit', replacement: path.join(uiKitRoot, 'src/index.ts') },
      { find: '@webonone/theme', replacement: path.join(themeRoot, 'src/index.ts') },
      { find: '@webonone/platform-nav', replacement: path.join(platformNavRoot, 'src/index.ts') },
      { find: '@webonone/platform-embed', replacement: path.join(platformEmbedRoot, 'src/index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 3018,
    strictPort: true,
  },
})
