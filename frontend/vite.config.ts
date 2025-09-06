import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Required for Docker
    port: 3000,
    watch: {
      usePolling: true, // Enables hot reload in Docker containers
    },
    hmr: {
      port: 3000,
      host: '0.0.0.0', // Required for Docker HMR
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})