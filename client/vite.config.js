import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-framework',
              test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//,
            },
            { name: 'vendor-query', test: /node_modules\/@tanstack\/react-query\// },
            { name: 'vendor-ui', test: /node_modules\/(@radix-ui|tailwind-merge)\// },
            { name: 'vendor-motion', test: /node_modules\/(motion|motion-dom|motion-utils)\// },
            { name: 'vendor', test: /node_modules\// },
          ],
        },
      },
    },
  },
})
