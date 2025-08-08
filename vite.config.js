import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/news-app/', // GitHub 저장소 이름과 동일하게
  build: {
    outDir: 'docs', // GitHub Pages용
  },
})
