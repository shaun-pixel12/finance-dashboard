import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/naver-api': {
        target: 'https://api.stock.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/naver-api/, ''),
        headers: {
          'Referer': 'https://m.stock.naver.com',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        }
      },
      '/naver-polling': {
        target: 'https://polling.finance.naver.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/naver-polling/, ''),
        headers: {
          'Referer': 'https://finance.naver.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    }
  }
})
