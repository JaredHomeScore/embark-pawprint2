import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/embark-pawprint/',
  css: {
    postcss: './postcss.config.js',
  },
})
