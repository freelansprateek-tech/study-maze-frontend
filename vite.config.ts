import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Port 5173 is the origin the backend allows by default (FRONTEND_ORIGIN in
// backend/.env). strictPort makes the dev server refuse to start on another
// port instead of silently moving to one that CORS would reject.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
})
