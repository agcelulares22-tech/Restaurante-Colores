import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          { urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'supabase-api', expiration: { maxEntries: 100, maxAgeSeconds: 300 } } },
          { urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'unsplash-images', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } } }
        ]
      },
      manifest: {
        name: 'Colores Pizza - Gestión Gastronómica',
        short_name: 'Colores Pizza',
        description: 'Sistema integral de gestión gastronómica para Colores Pizzería',
        theme_color: '#3b3b3b',
        background_color: '#3b3b3b',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        categories: ['business', 'food', 'productivity'],
        icons: [
          { src: '/logo-colores-pizzeria.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/logo-colores-pizzeria.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        shortcuts: [
          { name: 'Nuevo Pedido', short_name: 'Pedido', description: 'Abrir terminal de mozo', url: '/?view=mozo' },
          { name: 'Panel', short_name: 'Panel', description: 'Panel de control', url: '/?view=panel' }
        ]
      }
    })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react';
            if (id.includes('node_modules/@supabase/supabase-js')) return 'supabase';
            if (id.includes('node_modules/jspdf')) return 'pdf';
            if (id.includes('node_modules/lucide-react') || id.includes('node_modules/motion')) return 'ui';
          },
        },
      },
    },
  };
});
