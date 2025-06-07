// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load variables from .env, .env.local, etc. (only those prefixed with VITE_)
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Default to localhost:3001 if not provided
  const apiBase = env.VITE_API_BASE || 'http://localhost:3001';

  return {
    plugins: [
      react({ jsxRuntime: 'automatic' }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: true,          // expose dev-server on LAN if needed
      proxy: {
        // Any fetch/axios to "/api/**" will be forwarded to apiBase
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    // Optional: make the value easily available without import.meta.env
    define: {
      __API_BASE__: JSON.stringify(apiBase),
    },
  };
});
