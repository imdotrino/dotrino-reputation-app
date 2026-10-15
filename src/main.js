import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import '@dotrino/theme/theme.css'
import './style.css'

// PWA: recarga cuando el SW nuevo toma control + re-chequeo periódico, o la app
// instalada en móvil se queda vieja para siempre (CONVENCIONES §3).
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW (_url, reg) {
    if (reg) setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000)
  },
})
void updateSW

createApp(App).mount('#app')
