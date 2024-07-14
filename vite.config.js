import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')//配置路径别名
    }
  },
  server:{
    port:8989,
    proxy: {
        // 把key的路径代理到target位置
        "/api": { 
          target: `http://192.168.3.114:8123`, // 代理到 目标路径
          changeOrigin: true,
        }
      },

  }
})
