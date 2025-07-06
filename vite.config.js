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
      react(),
    ],
    root: '.', // Explicitly set root
    publicDir: 'public', // Explicitly set public directory
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'frontend/src'),
      },
    },
    server: {
      host: true,          // expose dev-server on LAN if needed
      headers: {
        // Security headers for development
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss: https: blob: http://localhost:3001; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'",
      },
      proxy: {
        // Any fetch/axios to "/api/**" will be forwarded to apiBase
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    build: {
      // Production build optimizations - use very conservative settings
      target: 'es2020',
      minify: false,  // Disable minification to debug constructor issues
      cssMinify: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            mui: ['@mui/material', '@mui/icons-material'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            charts: ['chart.js', 'react-chartjs-2'],
            maps: ['leaflet', 'react-leaflet'],
          },
        },
      },
    },
    // Optional: make the value easily available without import.meta.env
    define: {
      __API_BASE__: JSON.stringify(apiBase),
    },
  };
});
