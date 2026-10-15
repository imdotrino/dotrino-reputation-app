<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { messages } from '../i18n'
import { getReputation } from '../services/reputation'
import { myPubkey, nameOf } from '../services/identity'

const props = defineProps({
  subject: { type: String, required: true },
  lang: { type: String, default: 'es' },
})
const emit = defineEmits(['need-name'])
const t = computed(() => messages[props.lang])

const ranked = ref([])
const loading = ref(true)
const askText = ref('')
const asking = ref(false)
const openId = ref(null)          // pregunta expandida
const answerText = ref('')
const names = ref({})             // pk -> nombre|null

async function resolveNames (pks) {
  await Promise.all([...new Set(pks)].filter((p) => p && names.value[p] === undefined).map(async (pk) => {
    names.value = { ...names.value, [pk]: await nameOf(pk) }
  }))
}

async function load () {
  loading.value = true
  const rep = await getReputation()
  if (!rep) { loading.value = false; return }
  try {
    ranked.value = await rep.rankQuestions(props.subject)
    const pks = []
    for (const r of ranked.value) { pks.push(r.question.issuer); for (const a of r.answers) pks.push(a.issuer) }
    resolveNames(pks)
  } catch (e) { console.warn('[rank]', e && e.message); ranked.value = [] }
  loading.value = false
}
watch(() => props.subject, () => { openId.value = null; load() })
onMounted(load)

const label = (pk) => (pk === myPubkey() ? t.value.questions.byMe : (names.value[pk] || short(pk)))
function short (pk) { try { const j = JSON.parse(pk); return (j.x || '').slice(0, 6) + '…' } catch (_) { return (pk || '').slice(0, 6) + '…' } }

async function ask () {
  const text = askText.value.trim()
  if (!text) return
  const rep = await getReputation()
  if (!rep) return
  if (!myPubkey()) { emit('need-name', ask); return }
  asking.value = true
  try { await rep.postQuestion(props.subject, text); askText.value = ''; await load() }
  catch (e) { console.warn('[ask]', e && e.message) }
  asking.value = false
}

function myAnswer (r) { return r.answers.find((a) => a.issuer === myPubkey()) || null }

function toggle (r) {
  if (openId.value === r.question.questionId) { openId.value = null; return }
  openId.value = r.question.questionId
  answerText.value = myAnswer(r)?.text || ''
}

async function sendAnswer (r) {
  const text = answerText.value.trim()
  if (!text) return
  const rep = await getReputation()
  if (!rep) return
  if (!myPubkey()) { emit('need-name', () => sendAnswer(r)); return }
  try { await rep.answer(r.question.questionId, text); await load() }
  catch (e) { console.warn('[answer]', e && e.message) }
}

async function del (r) {
  const rep = await getReputation()
  if (!rep) return
  try { await rep.removeQuestion(r.question.questionId, props.subject); await load() }
  catch (_) {}
}
</script>

<template>
  <section class="qwrap">
    <div class="qhead">
      <h3>{{ t.questions.title }}</h3>
    </div>

    <!-- Hacer una pregunta -->
    <div class="ask">
      <input v-model="askText" :placeholder="t.questions.askPlaceholder" maxlength="280"
        @keyup.enter="ask" data-testid="ask-input" />
      <button :disabled="asking || !askText.trim()" @click="ask" data-testid="ask-btn">{{ t.questions.publish }}</button>
    </div>

    <p v-if="loading" class="muted">{{ t.loading }}</p>
    <p v-else-if="!ranked.length" class="muted empty">{{ t.questions.empty }}</p>

    <ul v-else class="qlist">
      <li v-for="r in ranked" :key="r.question.questionId" class="qitem" :data-qid="r.question.questionId">
        <div class="qmain" @click="toggle(r)">
          <div class="qtext">{{ r.question.text }}</div>
          <div class="qmeta">
            <span class="qby">{{ label(r.question.issuer) }}</span>
            <span class="qdot">·</span>
            <span class="qcount">{{ t.questions.answers(r.rawAnswerCount) }}</span>
            <span v-if="r.weightedAnswerers > 0" class="qnet" :title="t.questions.fromNetwork(r.weightedAnswerers)">
              ◆ {{ r.weightedAnswerers }}
            </span>
          </div>
        </div>

        <div v-if="openId === r.question.questionId" class="qbody">
          <ul class="answers" v-if="r.answers.length">
            <li v-for="a in r.answers" :key="a.issuer" class="ans" :class="{ net: a.credibility >= 0.05 }">
              <span class="adot" :style="{ opacity: 0.25 + 0.75 * Math.min(1, a.credibility) }"></span>
              <div class="atext">{{ a.text }}</div>
              <span class="aby">{{ label(a.issuer) }}</span>
            </li>
          </ul>

          <div class="answer-box">
            <input v-model="answerText" :placeholder="t.questions.answerPlaceholder" maxlength="280"
              @keyup.enter="sendAnswer(r)" data-testid="answer-input" />
            <button @click="sendAnswer(r)" :disabled="!answerText.trim()" data-testid="answer-btn">{{ t.questions.answer }}</button>
          </div>
          <button v-if="r.question.issuer === myPubkey()" class="del" @click="del(r)" data-testid="del-question">
            {{ t.questions.delete }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.qwrap { margin-top: 1.2rem; }
.qhead h3 { margin: 0 0 0.7rem; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-dim); font-weight: 700; }
.ask { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.ask input, .answer-box input { flex: 1; min-width: 0; padding: 0.7rem 0.9rem; border-radius: var(--radius-pill); border: 1px solid var(--line-2); background: var(--surface); color: var(--text); font: inherit; }
.ask input:focus, .answer-box input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.ask button, .answer-box button { padding: 0.7rem 1.1rem; border-radius: var(--radius-pill); border: none; background: var(--accent); color: var(--accent-ink); font-weight: 700; cursor: pointer; font: inherit; }
.ask button:hover:not(:disabled), .answer-box button:hover:not(:disabled) { background: var(--accent-press); }
.ask button:disabled, .answer-box button:disabled { opacity: 0.5; cursor: default; }
.muted { color: var(--text-dim); }
.empty { padding: 1.2rem 0; text-align: center; }
.qlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.qitem { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; box-shadow: var(--dt-shadow); }
.qmain { padding: 0.85rem 1rem; cursor: pointer; }
.qmain:hover { background: var(--surface-2); }
.qtext { color: var(--text); font-size: 1rem; line-height: 1.35; margin-bottom: 0.3rem; }
.qmeta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--text-dim); flex-wrap: wrap; }
.qby { font-weight: 600; color: var(--text-mid); }
.qnet { margin-left: auto; background: var(--accent-soft); color: var(--accent); padding: 0.1rem 0.5rem; border-radius: 999px; font-weight: 700; font-size: 0.75rem; }
.qbody { padding: 0.2rem 1rem 1rem; border-top: 1px solid var(--line); }
.answers { list-style: none; margin: 0.6rem 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.ans { display: grid; grid-template-columns: 10px 1fr auto; align-items: start; gap: 0.55rem; padding: 0.5rem 0; border-bottom: 1px dashed var(--line); }
.ans:last-child { border-bottom: none; }
.adot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 0.35rem; }
.ans:not(.net) .adot { background: var(--line-2); }
.atext { color: var(--text); font-size: 0.94rem; line-height: 1.35; }
.aby { font-size: 0.78rem; color: var(--text-dim); white-space: nowrap; }
.answer-box { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.del { margin-top: 0.6rem; background: none; border: none; color: var(--danger); font-size: 0.82rem; cursor: pointer; padding: 0; }
</style>
