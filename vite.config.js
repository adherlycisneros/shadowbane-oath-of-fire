import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Every entry must exist under public/; the plugin adds them to the precache. Besides the
      // icons, the two first-screen images are included so a fresh install shows the title
      // painting and intro parchment offline even though they load before the worker takes
      // control on the very first visit (about 0.5 MB together).
      includeAssets: [
        'icons/favicon.ico',
        'icons/favicon-96x96.png',
        'icons/apple-touch-icon.png',
        'assets/backgrounds/title-bg.webp',
        'assets/textures/aged-paper.webp',
        'assets/fonts/metal-mania-latin.woff2',
        'assets/fonts/quintessential-latin.woff2'
      ],
      manifest: {
        name: 'Shadowbane: Oath of Fire',
        short_name: 'Shadowbane',
        description: 'A dark-fantasy dungeon adventure. Guide Darklord and Chxospixie through six rooms of puzzles, combat, curses, and a final reckoning.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#1a0f0f',
        theme_color: '#1a0f0f',
        icons: [
          {
            src: '/icons/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            // Same emblem with padding so crown and sword tip stay inside the maskable safe zone.
            src: '/icons/web-app-manifest-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Old precache entries are dropped when a new build takes over.
        cleanupOutdatedCaches: true,
        // Game assets live under public/assets with stable (non-hashed) file names, so they are
        // not precached; they enter these caches as the game requests them (scene priming and
        // the music manager already request everything a playthrough needs).
        runtimeCaching: [
          {
            // Backgrounds, champion/enemy sprites, treasure art, textures: served from cache at
            // once, refreshed in the background, so a replaced file at the same URL is picked up
            // on the next visit without any cache-name bump.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /^\/assets\/(backgrounds|sprites|treasure|textures)\//.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'shadowbane-visuals-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 }
            }
          },
          {
            // Music tracks (1-6 MB each): cache-first so an installed app never re-streams them,
            // bounded to the soundtrack's size and re-fetched after 30 days so a replaced track
            // cannot stay stale indefinitely. Media elements stream with Range requests, which
            // are served from the cached full file (rangeRequests); the music manager performs
            // one plain fetch per track in production so the full file gets stored.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'shadowbane-audio-v1',
              cacheableResponse: { statuses: [200] },
              rangeRequests: true,
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      // Serve the generated manifest during `npm run dev` too, so the browser's manifest and
      // install checks behave like production instead of receiving the SPA HTML fallback.
      devOptions: {
        enabled: true,
        suppressWarnings: true
      }
    })
  ]
});
