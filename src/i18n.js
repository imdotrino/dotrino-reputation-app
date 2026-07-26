// Bilingüe es/en (CONVENCIONES §9). Español neutro / tuteo, SIN voseo.
// Lenguaje llano (§9.1): explicamos el beneficio, no la implementación.

export const LANG_KEY = 'dotrino-reputation-app:lang'

export function detectLang () {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch (_) {}
  const nav = (navigator.language || 'es').slice(0, 2)
  return nav === 'en' ? 'en' : 'es'
}

export const messages = {
  es: {
    tagline: 'Calificador de perfiles y redes',
    intro: 'Deja tu calificación de personas, sitios web y cuentas. Lo que dice tu red pesa; el ruido de desconocidos, no.',
    search: {
      pick: '¿Qué vas a calificar?',
      go: 'Abrir',
      recent: 'Vistos hace poco',
      // Una cuenta es siempre de una red concreta: el usuario elige cuál. Nada
      // se adivina (un «@juan» a secas puede ser de X, de LinkedIn o de GitHub).
      ph: {
        domain: 'tienda.com',
        x: 'usuario',
        linkedin: 'juan-perez',
        github: 'usuario',
        email: 'alguien@correo.com',
        profile: 'Pega aquí la llave pública…',
      },
      hint: {
        domain: 'La dirección del sitio web, sin https://',
        x: 'El nombre de usuario en X, sin la @. También sirve pegar el enlace.',
        linkedin: 'El identificador de LinkedIn, sin la @. También sirve pegar el enlace.',
        github: 'El nombre de usuario en GitHub, sin la @. También sirve pegar el enlace.',
        email: 'El correo no se guarda: viaja convertido en un código que no se puede revertir.',
        profile: 'La llave pública de esa persona. Si te compartieron su enlace, ábrelo y llegas directo.',
      },
      invalid: {
        domain: 'Eso no parece un sitio web. Ejemplo: tienda.com',
        x: 'Eso no parece un usuario de X. Ejemplo: dotrino',
        linkedin: 'Eso no parece un identificador de LinkedIn. Ejemplo: juan-perez',
        github: 'Eso no parece un usuario de GitHub. Ejemplo: imdotrino',
        email: 'Eso no parece un correo. Ejemplo: alguien@correo.com',
        profile: 'Eso no parece una llave pública.',
      },
    },
    // Corto, para los chips y los recientes.
    types: { profile: 'Perfil', domain: 'Sitio', x: 'X', github: 'GitHub', linkedin: 'LinkedIn', email: 'Correo' },
    // Largo, para la ficha: una cuenta siempre dice de qué red es.
    typesLong: {
      profile: 'Perfil', domain: 'Sitio web', x: 'Cuenta de X', github: 'Cuenta de GitHub',
      linkedin: 'Cuenta de LinkedIn', email: 'Correo',
    },
    axes: {
      title: 'Tu opinión',
      afinidad: 'Afinidad',
      confianza: 'Confianza',
      conoce: 'Conocimiento',
      afinidadHint: 'Yo soy afín',
      confianzaHint: 'Yo confío',
      conoceHint: 'Yo lo conozco',
      save: 'Guardar',
      saved: 'Guardado',
      remove: 'Quitar',
    },
    agg: {
      title: 'Según tu red',
      afinidad: 'Afinidad',
      confianza: 'Confianza',
      conoce: 'Conocimiento',
      none: 'Nadie de tu red opinó todavía',
      raw: (n) => `${n} ${n === 1 ? 'opinión' : 'opiniones'} en total`,
      trusted: (n) => `${n} de tu red`,
    },
    questions: {
      title: 'Preguntas',
      ask: 'Hacer una pregunta',
      askPlaceholder: '¿Qué quieres saber de esto?',
      publish: 'Publicar',
      answer: 'Responder',
      answerPlaceholder: 'Tu respuesta…',
      myAnswer: 'Tu respuesta',
      empty: 'Aún no hay preguntas. Haz la primera.',
      answers: (n) => `${n} ${n === 1 ? 'respuesta' : 'respuestas'}`,
      fromNetwork: (n) => (n > 0 ? `${n} de tu red` : 'nadie de tu red'),
      delete: 'Borrar',
      byMe: 'tú',
    },
    profileBtn: 'Mi perfil',
    needName: 'Ponte un nombre para calificar y preguntar.',
    loading: 'Cargando…',
    empty: 'Busca algo arriba para calificarlo o preguntar sobre ello.',
  },
  en: {
    tagline: 'Ratings for profiles and social accounts',
    intro: 'Leave your rating for people, websites and accounts. What your network says counts; noise from strangers doesn’t.',
    search: {
      pick: 'What are you rating?',
      go: 'Open',
      recent: 'Seen recently',
      ph: {
        domain: 'shop.com',
        x: 'username',
        linkedin: 'jane-doe',
        github: 'username',
        email: 'someone@mail.com',
        profile: 'Paste the public key here…',
      },
      hint: {
        domain: 'The website address, without https://',
        x: 'The X username, without the @. Pasting the link works too.',
        linkedin: 'The LinkedIn identifier, without the @. Pasting the link works too.',
        github: 'The GitHub username, without the @. Pasting the link works too.',
        email: 'The address isn’t stored: it travels as a code that can’t be turned back.',
        profile: 'That person’s public key. If they shared their link, open it and you’re there.',
      },
      invalid: {
        domain: 'That doesn’t look like a website. Example: shop.com',
        x: 'That doesn’t look like an X username. Example: dotrino',
        linkedin: 'That doesn’t look like a LinkedIn identifier. Example: jane-doe',
        github: 'That doesn’t look like a GitHub username. Example: imdotrino',
        email: 'That doesn’t look like an email. Example: someone@mail.com',
        profile: 'That doesn’t look like a public key.',
      },
    },
    types: { profile: 'Profile', domain: 'Site', x: 'X', github: 'GitHub', linkedin: 'LinkedIn', email: 'Email' },
    typesLong: {
      profile: 'Profile', domain: 'Website', x: 'X account', github: 'GitHub account',
      linkedin: 'LinkedIn account', email: 'Email',
    },
    axes: {
      title: 'Your take',
      afinidad: 'Affinity',
      confianza: 'Trust',
      conoce: 'Knowledge',
      afinidadHint: 'I relate to it',
      confianzaHint: 'I trust it',
      conoceHint: 'I know it',
      save: 'Save',
      saved: 'Saved',
      remove: 'Remove',
    },
    agg: {
      title: 'From your network',
      afinidad: 'Affinity',
      confianza: 'Trust',
      conoce: 'Knowledge',
      none: 'No one in your network has weighed in yet',
      raw: (n) => `${n} ${n === 1 ? 'opinion' : 'opinions'} total`,
      trusted: (n) => `${n} from your network`,
    },
    questions: {
      title: 'Questions',
      ask: 'Ask a question',
      askPlaceholder: 'What do you want to know about this?',
      publish: 'Publish',
      answer: 'Answer',
      answerPlaceholder: 'Your answer…',
      myAnswer: 'Your answer',
      empty: 'No questions yet. Ask the first one.',
      answers: (n) => `${n} ${n === 1 ? 'answer' : 'answers'}`,
      fromNetwork: (n) => (n > 0 ? `${n} from your network` : 'none from your network'),
      delete: 'Delete',
      byMe: 'you',
    },
    profileBtn: 'My profile',
    needName: 'Set a name to rate and ask.',
    loading: 'Loading…',
    empty: 'Search for something above to rate it or ask about it.',
  },
}
