// Icono de cada tipo de sujeto. Un tipo que no está en el mapa sale con '•'.
/** @type {Record<string, string>} */
const SUBJECT_ICONS = { domain: '🌐', x: '𝕏', github: '⌨', linkedin: 'in', email: '✉', profile: '👤', unknown: '•' }

/**
 * @param {string} type
 * @returns {string}
 */
export const subjectIcon = (type) => SUBJECT_ICONS[type] || '•'
