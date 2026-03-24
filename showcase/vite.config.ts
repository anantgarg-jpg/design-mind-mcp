import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@blocks': path.resolve(__dirname, '../blocks'),
      // Redirect external imports from block files to our local installs
      'lucide-react': path.resolve(__dirname, './node_modules/lucide-react'),
      'date-fns': path.resolve(__dirname, './node_modules/date-fns'),
      'recharts': path.resolve(__dirname, './node_modules/recharts'),
      'sonner': path.resolve(__dirname, './node_modules/sonner'),
      'react-hook-form': path.resolve(__dirname, './node_modules/react-hook-form'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
