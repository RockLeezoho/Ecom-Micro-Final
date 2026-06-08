import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from "node:path";
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            host: 'localhost',
            port: 3000,
            clientPort: 3000,
            protocol: 'ws',
          },
      watch: {
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
