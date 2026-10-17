// Identidad = vault id.dotrino.com (única fuente). No reimplementamos nada.
import { Identity } from '@dotrino/identity'

let identity = null

export async function getIdentity () {
  if (identity) return identity
  try { identity = await Identity.connect() } catch (e) {
    console.warn('[identity] vault unreachable:', e && e.message)
    identity = null
  }
  return identity
}

export function myPubkey () { return identity?.me?.publickey || null }
export function myName () { return identity?.me?.nickname || null }
export function myProfilePubkey () { return identity?.me?.publickey || null }

/** Pone mi nombre visible en el vault (necesario para calificar/preguntar). */
export async function setMyName (name) {
  const id = await getIdentity()
  const n = String(name || '').trim()
  if (!id || !n) return false
  try { await id.setMyNickname(n); return !!myName() } catch (_) { return false }
}

const nameCache = new Map()
/** Nombre legible de un pubkey (peer book del vault), o null. */
export async function nameOf (pk) {
  if (!pk) return null
  if (pk === myPubkey()) return myName()
  if (nameCache.has(pk)) return nameCache.get(pk)
  let n = null
  try { const id = await getIdentity(); n = (await id?.getPeer?.(pk))?.nickname || null } catch (_) {}
  nameCache.set(pk, n)
  return n
}
