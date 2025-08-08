import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages에 배포 시, base를 저장소 이름으로 설정
export default defineConfig({
  base: '/news-app/', // ✅ GitHub Pages 저장소명
  plugins: [react()],
})
