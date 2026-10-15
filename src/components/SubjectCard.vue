<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { messages } from '../i18n'
import { getReputation } from '../services/reputation'
import { myPubkey } from '../services/identity'
import { parseSubjectRef } from '@dotrino/reputation'

const props = defineProps({
  subject: { type: String, required: true }, // ref canónico
  lang: { type: String, default: 'es' },
})
const emit = defineEmits(['need-name'])
const t = computed(() => messages[props.lang])

const parsed = computed(() => parseSubjectRef(props.subject))
// Largo a propósito: una cuenta siempre dice de qué red es ("Cuenta de LinkedIn").
const typeLabel = computed(() => t.value.typesLong[parsed.value.type] || parsed.value.type)
const typeIcon = { domain: '🌐', x: '𝕏', github: '⌨', linkedin: 'in', email: '✉', profile: '👤', unknown: '•' }

// mi calificación (afinidad/confianza/conocimiento 0..5|null)
const conf = ref(null)
const afin = ref(null)
const conoce = ref(null)
const saving = ref(false)
const savedFlash = ref(false)

// agregado por mi red
const agg = ref(null)
const loading = ref(true)

async function load () {
  loading.value = true
  const rep = await getReputation()
  if (!rep) { loading.value = false; return }
  try {
    // Cada eje es una atestación independiente: el paquete las fusiona (leer solo
    // la primera devolvía un eje y los otros dos salían en 0).
    const ind = await rep.myIndicatorsFor(props.subject)
    conf.value = num(ind.confianza)
    afin.value = num(ind.afinidad)
    conoce.value = num(ind.conoce)
    agg.value = await rep.reputationOf(props.subject)
  } catch (_) {}
  loading.value = false
}
const num = (v) => (typeof v === 'number' ? v : null)

watch(() => props.subject, load)
onMounted(load)

function setStar (axis, v) {
  const r = axis === 'conf' ? conf : axis === 'afin' ? afin : conoce
  r.value = r.value === v ? 0 : v
}

async function save () {
  const rep = await getReputation()
  if (!rep) return
  if (!myPubkey()) { emit('need-name', save); return }
  const map = {}
  if (conf.value != null) map.confianza = conf.value
  if (afin.value != null) map.afinidad = afin.value
  if (conoce.value != null) map.conoce = conoce.value
  if (!Object.keys(map).length) return
  saving.value = true
  try {
    await rep.rate(props.subject, map)
    savedFlash.value = true
    setTimeout(() => (savedFlash.value = false), 1600)
    await load()
  } catch (e) { console.warn('[rate]', e && e.message) }
  saving.value = false
}

const pct = (s) => (s == null ? null : Math.round(s * 100))
const aggConf = computed(() => agg.value?.indicators?.confianza || null)
const aggAfin = computed(() => agg.value?.indicators?.afinidad || null)
const aggConoce = computed(() => agg.value?.indicators?.conoce || null)
</script>

<template>
  <section class="card">
    <header class="subj-head">
      <div class="subj-badge" :data-type="parsed.type">{{ typeIcon[parsed.type] || '•' }}</div>
      <div class="subj-id">
        <span class="subj-type">{{ typeLabel }}</span>
        <span class="subj-val" :title="parsed.value">
          {{ parsed.opaque ? '••••••' : parsed.value }}
        </span>
      </div>
    </header>

    <!-- Mi opinión -->
    <div class="block">
      <h3>{{ t.axes.title }}</h3>
      <div class="axis">
        <label>{{ t.axes.afinidad }} <small>{{ t.axes.afinidadHint }}</small></label>
        <div class="stars" role="radiogroup" :aria-label="t.axes.afinidad">
          <button v-for="i in 5" :key="i" class="star afin" :class="{ on: (afin || 0) >= i }"
            @click="setStar('afin', i)" :aria-label="i + '/5'" data-testid="star-afin">★</button>
        </div>
      </div>
      <div class="axis">
        <label>{{ t.axes.confianza }} <small>{{ t.axes.confianzaHint }}</small></label>
        <div class="stars" role="radiogroup" :aria-label="t.axes.confianza">
          <button v-for="i in 5" :key="i" class="star" :class="{ on: (conf || 0) >= i }"
            @click="setStar('conf', i)" :aria-label="i + '/5'" data-testid="star-conf">★</button>
        </div>
      </div>
      <div class="axis">
        <label>{{ t.axes.conoce }} <small>{{ t.axes.conoceHint }}</small></label>
        <div class="stars" role="radiogroup" :aria-label="t.axes.conoce">
          <button v-for="i in 5" :key="i" class="star know" :class="{ on: (conoce || 0) >= i }"
            @click="setStar('conoce', i)" :aria-label="i + '/5'" data-testid="star-conoce">★</button>
        </div>
      </div>
      <button class="save" :disabled="saving" @click="save" data-testid="save-rating">
        {{ savedFlash ? t.axes.saved : t.axes.save }}
      </button>
    </div>

    <!-- Según tu red -->
    <div class="block agg">
      <h3>{{ t.agg.title }}</h3>
      <div v-if="loading" class="muted">{{ t.loading }}</div>
      <template v-else-if="agg && (aggConf?.trustedCount || aggAfin?.trustedCount || aggConoce?.trustedCount)">
        <div class="meter afinm" v-if="aggAfin && aggAfin.score != null">
          <span class="mlabel">{{ t.agg.afinidad }}</span>
          <span class="bar"><i :style="{ width: pct(aggAfin.score) + '%' }"></i></span>
          <span class="mval">{{ pct(aggAfin.score) }}%</span>
        </div>
        <div class="meter" v-if="aggConf && aggConf.score != null">
          <span class="mlabel">{{ t.agg.confianza }}</span>
          <span class="bar"><i :style="{ width: pct(aggConf.score) + '%' }"></i></span>
          <span class="mval">{{ pct(aggConf.score) }}%</span>
        </div>
        <div class="meter knowm" v-if="aggConoce && aggConoce.score != null">
          <span class="mlabel">{{ t.agg.conoce }}</span>
          <span class="bar"><i :style="{ width: pct(aggConoce.score) + '%' }"></i></span>
          <span class="mval">{{ pct(aggConoce.score) }}%</span>
        </div>
        <p class="sub muted">{{ t.agg.trusted(aggConf?.trustedCount || aggAfin?.trustedCount || aggConoce?.trustedCount || 0) }} · {{ t.agg.raw(agg.rawCount || 0) }}</p>
      </template>
      <template v-else>
        <p class="muted">{{ t.agg.none }}</p>
        <p v-if="agg && agg.rawCount" class="sub muted">{{ t.agg.raw(agg.rawCount) }}</p>
      </template>
    </div>
  </section>
</template>

<style scoped>
/* Cool & Cozy: card blanca sobre el crema, separada por sombra ambiental suave
   (no borde duro). */
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; box-shadow: var(--dt-shadow); }
.subj-head { display: flex; align-items: center; gap: 0.85rem; padding: 1.1rem 1.2rem; border-bottom: 1px solid var(--line); background: var(--surface-2); }
.subj-badge { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 12px; font-size: 1.3rem; background: var(--accent-soft); color: var(--accent); flex: none; }
.subj-id { display: flex; flex-direction: column; min-width: 0; }
.subj-type { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); }
.subj-val { font-size: 1.15rem; font-weight: 650; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.block { padding: 1.1rem 1.2rem; }
.block + .block { border-top: 1px solid var(--line); }
h3 { margin: 0 0 0.8rem; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-dim); font-weight: 700; }
.axis { margin-bottom: 0.9rem; }
.axis label { display: block; font-size: 0.95rem; color: var(--text); margin-bottom: 0.35rem; }
.axis label small { color: var(--text-dim); font-weight: 400; font-size: 0.8rem; margin-left: 0.3rem; }
.stars { display: flex; gap: 0.15rem; }
.star { background: none; border: none; cursor: pointer; font-size: 1.7rem; line-height: 1; color: var(--line-2); padding: 0 0.05rem; transition: color 0.12s, transform 0.1s; }
.star:hover { transform: scale(1.12); }
.star.on { color: var(--gold); }
.star.afin.on { color: var(--accent); }
.star.know.on { color: var(--know); }
.save { font: inherit; cursor: pointer; margin-top: 0.4rem; width: 100%; padding: 0.7rem; border-radius: var(--radius-pill); border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700; font-size: 0.95rem; }
.save:hover:not(:disabled) { background: var(--accent-press); }
.save:disabled { opacity: 0.6; }
.meter { display: grid; grid-template-columns: 5.5rem 1fr 2.6rem; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
.mlabel { font-size: 0.85rem; color: var(--text-dim); }
.bar { height: 9px; border-radius: 999px; background: var(--line); overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-2)); border-radius: 999px; }
.afinm .bar i { background: linear-gradient(90deg, var(--accent), var(--brand-soft)); }
.knowm .bar i { background: linear-gradient(90deg, var(--know), var(--know-2)); }
.mval { text-align: right; font-variant-numeric: tabular-nums; font-weight: 650; color: var(--text); font-size: 0.9rem; }
.muted { color: var(--text-dim); font-size: 0.92rem; margin: 0.2rem 0; }
.sub { font-size: 0.82rem; margin-top: 0.4rem; }
</style>
