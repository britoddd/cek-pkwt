import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The FastAPI backend (../backend) runs on :8000; the dev and preview servers forward /api to it.
const proxy = { '/api': 'http://localhost:8000' }

export default defineConfig({
  plugins: [react()],
  // Allow importing the brand files in ../assets (logos, design tokens).
  server: { proxy, fs: { allow: ['..'] } },
  preview: { proxy },
})
