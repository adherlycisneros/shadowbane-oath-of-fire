import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico',
        'icons/favicon-32x32.png',
        'icons/favicon-96x96.png',
        'icons/favicon-192x192.png',
        'icons/favicon-512x512.png',
        'icons/apple-touch-icon.png'
      ],
      manifest: {
        name: 'Shadowbane: Oath of Fire',
        short_name: 'Shadowbane',
        description: 'A fantasy quest built with love 💖',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#1a0f0f',
        theme_color: '#1a0f0f',
        icons: [
          {
            src: '/icons/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
