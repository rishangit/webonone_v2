import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const uiKitRoot = path.resolve(__dirname, '../../ui-kit/package')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@webonone/ui-kit/styles', replacement: path.join(uiKitRoot, 'src/styles/globals.css') },
      { find: '@webonone/ui-kit/tailwind', replacement: path.join(uiKitRoot, 'tailwind.config.ts') },
      { find: '@webonone/ui-kit', replacement: path.join(uiKitRoot, 'src/index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  server: { port: 3000 },
})
