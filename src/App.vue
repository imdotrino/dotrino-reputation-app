<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { detectLang, LANG_KEY, messages } from './i18n'
import '@dotrino/topbar'
import '@dotrino/install'
import { parseSubjectRef } from '@dotrino/reputation'
import { getIdentity, myPubkey } from './services/identity'
import { getReputation } from './services/reputation'
import { recordSubject, loadRecents } from './services/store'
import SubjectInput from './components/SubjectInput.vue'
import SubjectCard from './components/SubjectCard.vue'
import QuestionsList from './components/QuestionsList.vue'

const lang = ref(detectLang())
watch(lang, (l) => { try { localStorage.setItem(LANG_KEY, l) } catch (_) {}; document.documentElement.lang = l }, { immediate: true })
const t = computed(() => messages[lang.value])

const identityInst = ref(null)
const reputationInst = ref(null)
const topbarRef = ref(null)
const recents = ref([])
const current = ref(null)        // { ref, type, value }

// Tema del modal de perfil (topbar es dueño), acorde al claro Cool & Cozy.
const profileTheme = {
  '--ccp-bg': '#ffffff', '--ccp-bg-2': '#f4f7f9', '--ccp-bg-3': '#eaeff3', '--ccp-bg-4': '#e3e9ed',
  '--ccp-border': '#cfd8de', '--ccp-text': '#181c1e', '--ccp-muted': '#4a5560',
  '--ccp-accent': '#00658c', '--ccp-accent-2': '#00506f', '--ccp-accent-text': '#ffffff',
  '--ccp-gold': '#c98a00', '--ccp-derived': '#b07f00',
  '--ccp-online': '#00897b', '--ccp-affinity': '#2f8fd6', '--ccp-input-bg': '#f1f4f6', '--ccp-radius': '16px',
  '--ccp-font': "'Quicksand', 'Hanken Grotesk', system-ui, sans-serif",
  '--ccp-font-headline': "'Quicksand', 'Bricolage Grotesque', system-ui, sans-serif",
  '--ccp-font-mono': "'JetBrains Mono', ui-monospace, monospace",
}

// Pasa identity/reputation/tema al topbar (propiedades JS del Web Component).
watchEffect(() => {
  const tb = topbarRef.value
  if (!tb) return
  tb.identity = identityInst.value ?? null
  tb.reputation = reputationInst.value ?? null
  tb.profileTheme = profileTheme
})

// El estado del respaldo en la bóveda, a la vista en el botón de perfil (topbar ≥ 0.13).
watchEffect(() => {
  const tb = topbarRef.value
  if (!tb || !identityInst.value) return
  import('./services/store.js').then((m) => m.getStore()).then((s) => { tb.store = s }).catch(() => {})
})

// need-name: acciones firmadas requieren apodo. Si falta, abrimos el perfil
// EDITABLE (el topbar lo abre) y reanudamos la acción al guardar el nombre.
let pendingAction = null
async function needName (run) {
  await getIdentity()
  if (myPubkey() && identityInst.value?.me?.nickname) { run(); return }
  pendingAction = run
  try { topbarRef.value?.openMyProfile({ editable: true }) } catch (_) {}
}
function onProfileName () {
  const run = pendingAction; pendingAction = null
  if (run) run()
}

const onLang = (e) => { const l = e?.detail?.lang; if (l === 'es' || l === 'en') lang.value = l }

async function openSubject (s) {
  current.value = s
  try { history.replaceState(history.state, '', '#s=' + encodeURIComponent(s.ref)) } catch (_) {}
  recordSubject(s.ref, s.value, s.type).then(() => refreshRecents())
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function closeSubject () {
  current.value = null
  try { history.replaceState(history.state, '', location.pathname) } catch (_) {}
}
async function refreshRecents () { recents.value = await loadRecents() }

// Deep-link por #fragment (#s=<ref>): nunca llega al servidor, no indexable.
async function fromHash () {
  const m = location.hash.match(/^#s=(.+)$/)
  if (!m) { current.value = null; return }
  try {
    const ref_ = decodeURIComponent(m[1])
    const p = parseSubjectRef(ref_)
    current.value = { ref: ref_, type: p.type, value: p.opaque ? '••••' : p.value }
  } catch (_) {}
}
window.addEventListener('hashchange', fromHash)

onMounted(async () => {
  const id = await getIdentity()
  identityInst.value = id
  if (id) { try { reputationInst.value = await getReputation() } catch (_) {} }
  refreshRecents()
  fromHash()
})

const isProfile = computed(() => current.value?.type === 'profile')
</script>

<template>
  <dotrino-topbar
    ref="topbarRef"
    class="topbar"
    brand="Reputation"
    icon="/icon.svg"
    brand-href="./"
    :lang="lang"
    profile
    support-href="https://ko-fi.com/dotrino"
    support-repo="imdotrino/dotrino-reputation-app"
    support-discord="https://discord.gg/D648uq7cth"
    @dotrino-lang="onLang"
    @dotrino-profile-name="onProfileName"
  >
    <dotrino-install slot="end" class="cc-install" :lang="lang"></dotrino-install>
  </dotrino-topbar>

  <main class="wrap">
    <!-- Intro + búsqueda (siempre visible arriba) -->
    <section class="hero" :class="{ slim: current }">
      <h1 v-if="!current">{{ t.tagline }}</h1>
      <p v-if="!current" class="lede">{{ t.intro }}</p>
      <SubjectInput :lang="lang" :recents="recents" @open="openSubject" />
    </section>

    <!-- Ficha del sujeto -->
    <section v-if="current" class="subject">
      <button class="back" @click="closeSubject">← {{ lang === 'es' ? 'Volver' : 'Back' }}</button>
      <SubjectCard :subject="current.ref" :lang="lang" @need-name="needName" />
      <QuestionsList :subject="current.ref" :lang="lang" @need-name="needName" />
    </section>

    <section v-else class="empty-hint">
      <p>{{ t.empty }}</p>
    </section>
  </main>
</template>

<style scoped>
.topbar {
  position: sticky; top: 0; z-index: 100;
  /* Tema del topbar (el paquete lee estas vars con fallback al oscuro). */
  --dotrino-topbar-bg: rgba(244, 247, 249, 0.9);
  --dotrino-topbar-border: var(--line);
  --dotrino-topbar-text: var(--text);
  --dotrino-topbar-muted: var(--text-dim);
  --dotrino-topbar-accent: var(--accent);
  --dotrino-topbar-accent-text: var(--accent-ink);
  --dotrino-topbar-font: var(--font-body);
  /* Moneda de support (vive en el shadow del topbar): las --ds-* heredan hacia
     adentro y la tematizan clara. */
  --ds-accent: #00658c; --ds-accent-press: #00506f;
  --ds-modal-bg: #ffffff; --ds-modal-text: #181c1e; --ds-modal-muted: #4a5560;
  --ds-modal-border: #e3e9ed; --ds-modal-hover: rgba(0, 0, 0, 0.06);
  display: block;
}
.topbar::part(brand-icon) { width: 32px; height: 32px; border-radius: 8px; }
.topbar::part(brand-name) { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.01em; }
.topbar::part(lang) { border-color: var(--line-2); background: var(--surface); }
.topbar::part(lang-btn) { font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.04em; }
.topbar::part(profile) { width: 36px; height: 36px; background: var(--surface); border-color: var(--line-2); color: var(--text); }

.wrap { max-width: 680px; margin: 0 auto; padding: 1.4rem clamp(0.9rem, 4vw, 1.5rem) 4rem; }
.hero { text-align: center; padding: 2.2rem 0 1.4rem; transition: padding 0.2s; }
.hero.slim { padding: 0.4rem 0 0.8rem; }
.hero h1 { font-size: clamp(1.7rem, 6vw, 2.5rem); margin: 0 0 0.6rem; letter-spacing: -0.02em; line-height: 1.1; }
.lede { color: var(--text-mid); font-size: 1.05rem; max-width: 32rem; margin: 0 auto 1.6rem; line-height: 1.5; }
.subject { margin-top: 0.6rem; }
.back { background: none; border: none; color: var(--text-dim); cursor: pointer; font: inherit; font-size: 0.9rem; padding: 0 0 0.8rem; }
.back:hover { color: var(--text); }
.empty-hint { text-align: center; color: var(--text-dim); padding: 2.5rem 1rem; }
.cc-install {
  --cc-install-bg: var(--accent); --cc-install-color: var(--accent-ink);
  --cc-install-bg-hover: var(--accent-press); --cc-install-radius: var(--radius-pill);
  --cc-install-pad: 0.45rem 0.95rem; --cc-install-font-size: 0.84rem;
}
</style>
