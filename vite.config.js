import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/news-app/', // GitHub Pages 경로
  build: {
    outDir: 'docs',   // Pages에서 docs 폴더 사용
    emptyOutDir: true // 빌드 시 기존 파일 삭제
  }
});
