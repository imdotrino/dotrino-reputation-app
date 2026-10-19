// Icono de cada tipo de sujeto. Un tipo que no está en el mapa sale con '•'.
const SUBJECT_ICONS = { domain: '🌐', x: '𝕏', github: '⌨', linkedin: 'in', email: '✉', profile: '👤', unknown: '•' }

export const subjectIcon = (type) => SUBJECT_ICONS[type] || '•'
