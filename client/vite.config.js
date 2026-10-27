import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-framework'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }
            if (id.includes('@radix-ui') || id.includes('tailwind-merge')) {
              return 'vendor-ui'
            }
            return 'vendor'
          }
        },
      },
    },
  },
})
