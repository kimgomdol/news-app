import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/news-app/', // GitHub Pages 서브 디렉토리 경로
  build: {
    outDir: 'docs'
  }
})
