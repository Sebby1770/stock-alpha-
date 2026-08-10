import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path for GitHub Pages: set VITE_BASE or default to /stock-alpha-/
// (matches repo name Sebby1770/stock-alpha-). Override with VITE_BASE=/ for local root.
const base = process.env.VITE_BASE ?? '/stock-alpha-/'

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
