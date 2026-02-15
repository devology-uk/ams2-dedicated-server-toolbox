import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: './dist-ui'
  },
  server: {
    port: 5173,
    strictPort: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@config-builder': path.resolve(__dirname, './src/ui/features/config-builder')
    }
  }
})