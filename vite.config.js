import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import prerender from '@dotrino/prerender/vite'

// Hash del commit del build → <meta name="commit"> (CONVENCIONES §3): permite
// verificar qué versión sirve el dominio y diagnosticar cachés viejas.
let COMMIT = 'dev'
try { COMMIT = execSync('git rev-parse --short HEAD').toString().trim() } catch (_) {}
function commitMeta () {
  return {
    name: 'commit-meta',
    transformIndexHtml (html) {
      return html.replace('</head>', `  <meta name="commit" content="${COMMIT}">\n</head>`)
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [
    // El HTML llega con contenido para quien lo lee sin ejecutar JavaScript.
    prerender(),
    vue({
      template: {
        compilerOptions: {
          // Web Components del ecosistema (@dotrino/*)
          isCustomElement: (tag) => tag.startsWith('dotrino-'),
        },
      },
    }),
    commitMeta(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Reputation — Dotrino',
        short_name: 'Reputation',
        description: 'Calificador de perfiles y redes: deja tu calificación de personas, sitios y cuentas. Ponderado por tu red de confianza, sin rastreo.',
        theme_color: '#00658c',
        background_color: '#f7fafc',
        display: 'standalone',
        start_url: './',
        scope: './',
        launch_handler: { client_mode: 'focus-existing' },
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // El SW existe para instalabilidad; sin precache (el registro va siempre a la red).
      workbox: {
        globPatterns: [],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
        navigateFallback: null,
      },
    }),
  ],
})
