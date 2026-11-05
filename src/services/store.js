// Almacén del usuario (store.dotrino.com): guardamos los sujetos que MIRÉ para
// mostrarlos como "vistos hace poco". Es lo único durable de esta app (las
// calificaciones/preguntas viajan al registro, no al store). Best-effort.
import { Store } from '@dotrino/store'
import { getIdentity } from './identity.js'

const RECENTS = 'reputation:recent-subjects'
const MAX = 24

/** @type {Store | null} */
let store = null
/**
 * El almacén del perfil activo, conectado una vez. Lanza `no-identity` sin vault.
 * @returns {Promise<Store>}
 */
export async function getStore () {
  if (store) return store
  // Atado al PERFIL (respaldo en la bóveda, sin mezclar cuentas). Hasta 2026-09-30 conectaba
  // sin identidad y todo quedaba en el espacio común del navegador; `adoptCommon` lo trae al
  // perfil una vez, sin borrar el original.
  const identity = await getIdentity()
  if (!identity) throw Object.assign(new Error('identity not available'), { code: 'no-identity' })
  store = await Store.connect({ identity, adoptCommon: ['reputation:'] })
  return store
}

// El store viaja por postMessage al iframe del vault (structured clone): aplanamos
// a JSON plano por si vienen proxies reactivos de Vue.
/**
 * @template T
 * @param {T} v
 * @returns {T}
 */
const plain = (v) => JSON.parse(JSON.stringify(v))

/**
 * Un sujeto visto hace poco.
 * @typedef {{ ref: string, label: string, type: string, ts: number }} RecentSubject
 */

/**
 * Registra que abrí un sujeto (dedup por ref, más reciente primero).
 * @param {string} ref
 * @param {string} label
 * @param {string} type
 * @returns {Promise<void>}
 */
export async function recordSubject (ref, label, type) {
  try {
    const s = await getStore()
    await s.appendMessage(RECENTS, plain({ ref, label, type, ts: Date.now() }))
  } catch (_) { /* store no disponible: sin recientes, la app sigue */ }
}

/**
 * Lista de sujetos vistos, dedup por ref, más reciente primero.
 * @returns {Promise<RecentSubject[]>}
 */
export async function loadRecents () {
  try {
    const s = await getStore()
    const entries = await s.listThread(RECENTS, { limit: 200 }).catch(() => [])
    /** @type {Map<string, RecentSubject>} */
    const byRef = new Map()
    for (const e of entries) {
      const r = e && e.ref
      if (!r) continue
      const prev = byRef.get(r)
      if (!prev || (e.ts || 0) > (prev.ts || 0)) byRef.set(r, /** @type {RecentSubject} */ (e))
    }
    return [...byRef.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, MAX)
  } catch (_) { return [] }
}
