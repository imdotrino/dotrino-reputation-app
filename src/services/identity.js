// Identidad = vault id.dotrino.com (única fuente). No reimplementamos nada.
import { Identity } from '@dotrino/identity'

/** @type {Identity | null} */
let identity = null

/**
 * La identidad del vault, conectada una vez. `null` si el vault no responde.
 * @returns {Promise<Identity | null>}
 */
export async function getIdentity () {
  if (identity) return identity
  try { identity = await Identity.connect() } catch (e) {
    console.warn('[identity] vault unreachable:', /** @type {Error} */ (e)?.message)
    identity = null
  }
  return identity
}

/** @returns {string | null} */
export function myPubkey () { return identity?.me?.publickey || null }
/** @returns {string | null} */
export function myName () { return identity?.me?.nickname || null }
/** @returns {string | null} */
export function myProfilePubkey () { return identity?.me?.publickey || null }

/**
 * Pone mi nombre visible en el vault (necesario para calificar/preguntar).
 * @param {unknown} name
 * @returns {Promise<boolean>}
 */
export async function setMyName (name) {
  const id = await getIdentity()
  const n = String(name || '').trim()
  if (!id || !n) return false
  try { await id.setMyNickname(n); return !!myName() } catch (_) { return false }
}

/** @type {Map<string, string | null>} */
const nameCache = new Map()
/**
 * Nombre legible de un pubkey (peer book del vault), o null.
 * @param {string | null | undefined} pk
 * @returns {Promise<string | null>}
 */
export async function nameOf (pk) {
  if (!pk) return null
  if (pk === myPubkey()) return myName()
  if (nameCache.has(pk)) return nameCache.get(pk) ?? null
  let n = null
  try { const id = await getIdentity(); n = (await id?.getPeer?.(pk))?.nickname || null } catch (_) {}
  nameCache.set(pk, n)
  return n
}
