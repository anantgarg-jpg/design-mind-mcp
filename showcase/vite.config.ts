import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@blocks': path.resolve(__dirname, '../blocks'),
      // Redirect lucide-react imports from block files to our local install
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
