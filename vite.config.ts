import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 安全防禦偵測是否在 Vercel 進行雲端構建，防止 Node.js 型別宣告未就緒時的編譯錯誤
const isVercel = typeof process !== 'undefined' && !!process.env?.VERCEL;

// https://vite.dev/config/
export default defineConfig({
  base: isVercel ? '/' : '/PinyinQuiz/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

