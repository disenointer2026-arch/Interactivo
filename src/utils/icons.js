/* Iconos SVG propios (trazo redondeado). Uso: icon('undo') */
const P = {
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  reset: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3L3.5 8.2"/><path d="M3.5 3.5v4.7h4.7"/>',
  front: '<circle cx="12" cy="9" r="4.5"/><path d="M5 21c1.4-3.6 3.9-5.2 7-5.2s5.6 1.6 7 5.2"/>',
  rotate: '<path d="M20.5 12a8.5 8.5 0 0 1-14.9 5.6"/><path d="M3.5 12A8.5 8.5 0 0 1 18.4 6.4"/><path d="M18.5 2.5v4h-4"/><path d="M5.5 21.5v-4h4"/>',
  zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8M11 8v6M8 11h6"/>',
  zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8M8 11h6"/>',
  save: '<path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"/>',
  sound: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.5a7.8 7.8 0 0 1 0 11"/>',
  soundOff: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  bag: '<path d="M5 8h14l-1.2 12.5H6.2z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  card: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><circle cx="12" cy="10" r="3"/><path d="M8.5 17h7"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
  download: '<path d="M12 4v11m-5-5 5 5 5-5"/><path d="M5 20h14"/>',
  arrowLeft: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  arrowUp: '<path d="M12 20V6m-6 6 6-6 6 6"/>',
  arrowRight: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 12h.01"/>',
  body: '<circle cx="12" cy="7" r="3.5"/><path d="M6.5 21v-4.5a5.5 5.5 0 0 1 11 0V21"/>',
  hair: '<path d="M5 15c0-6.5 3.2-11 7-11s7 4.5 7 11"/><path d="M5 15c2.2-1 3.3-4 3.3-6.3C10.5 11 14 12 19 11.5"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M9 10v1M15 10v1M8.5 15c2 2 5 2 7 0"/>',
  shirt: '<path d="M8.5 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4.5-3c-.9 1.4-2.1 2-3.5 2s-2.6-.6-3.5-2z"/>',
  glasses: '<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M3.5 13 5 8M20.5 13 19 8"/>',
  truck: '<path d="M3 6.5h11v9.5H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  store: '<path d="M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9h16"/><path d="M10 20v-6h4v6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  none: '<circle cx="12" cy="12" r="8"/><path d="m6.5 17.5 11-11"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  sparkle: '<path d="M12 3.5c.6 4.2 2.3 6.5 6.5 7.5-4.2 1-5.9 3.3-6.5 7.5-.6-4.2-2.3-6.5-6.5-7.5 4.2-1 5.9-3.3 6.5-7.5z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'
}

/* Hoja del sitio: la misma forma de static/images/ui/boton-llavero.svg (relleno, no trazo) */
const LEAF = '<path d="M108.63,60v.5c-.17.1-.1.38-.1.55-.05,4.79-.81,9.55-2.5,14.03-2.81,7.42-8.35,13.89-15.69,17.07l-.23-.13c1.02-1.83,1.84-3.78,2.27-5.84,3.08-14.58-11.39-22.47-23.74-16.94-7.15,3.2-10.63,10.67-9.45,18.34,1.24,8.1,9.29,12.22,16.9,12,.2.17-.84.73-.96.79-2.59,1.33-7.1,1.98-10.02,2.3-19,2.14-40.56-.71-58.45-7.33-1.45-.54-3.37-1.2-4.72-1.89-.45-.24-.64-.38-.97-.79v-.2l4.16-6.51c5.86-11.87,6.11-25.43,9.81-37.98,3.57-12.08,8.61-22.78,19.91-29.28,14.36-8.26,34.64-6.35,43.71,8.6.19.32.71,1.49.97,1.54.45.08.8-.83,1-1.21,4.02-7.27,6.8-16.85,8.24-25.02.12-.67,0-1.42.52-1.94h.1c4.63,2.58,9.01,5.69,12.68,9.51l.05.35c-.72.94-1.65,1.78-2.46,2.66-3.35,3.66-6.8,7.48-9.86,11.38-1.35,1.71-4.01,5.05-4.73,6.99-.14.37-.39.82.09,1.05,8.1.73,15.74,6.27,19.74,13.22,2.4,4.17,3.57,8.79,3.62,13.61,0,.17-.06.45.1.55Z"/>'

export function icon (name, cls = '') {
  if (name === 'leaf') return `<svg class="icon icon--leaf ${cls}" viewBox="0 0 108.5 103" aria-hidden="true" focusable="false" fill="currentColor">${LEAF}</svg>`
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`
}

/* Seto frondoso de hojas con manzanas (estilo Animal Crossing).
   Es un patrón SVG que se repite solo, así que sirve a cualquier ancho.
   Ajustes rápidos: TILE (ancho del patrón), FOLIAGE_H (alto del seto),
   LEAF_COUNT (cuántas hojas por repetición) y APPLES (cuántas manzanas y dónde). */
const TILE = 480
export const FOLIAGE_H = 118
/** Dónde empieza la masa verde: por encima solo asoman hojas sueltas. */
export const SPROUT_H = 28
const LEAF_COUNT = 330
const SPROUT_COUNT = 52
const APPLE_COUNT = 3
const GREENS = ['#2E7231', '#38853A', '#458F3F', '#4E9E46', '#5BAC4F', '#69B95A']
const APPLE_REDS = ['#E42A32', '#D21F28', '#EB3A40']

export function foliage (id) {
  /* Generador determinista: el seto se ve siempre igual, pero desordenado. */
  let seed = 20260408
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const put = (list, l) => {
    list.push(l)
    if (l.x < 30) list.push({ ...l, x: l.x + TILE })        // copia para que
    if (l.x > TILE - 30) list.push({ ...l, x: l.x - TILE }) // el patrón calce
  }

  /* Hojas sueltas que asoman por encima de la masa: rompen la línea recta del borde.
     Nacen bastante abajo para que la punta nunca llegue al tope del patrón (si lo
     cruzara, el patrón la cortaría en recto y volvería a verse la línea). */
  const sprouts = []
  for (let i = 0; i < SPROUT_COUNT; i++) {
    put(sprouts, {
      x: rand() * TILE,
      y: SPROUT_H - 2 + rand() * 14,
      rot: -150 + rand() * 120,
      scale: 0.72 + rand() * 0.3,
      fill: GREENS[2 + Math.floor(rand() * 3)]
    })
  }

  const leaves = []
  for (let i = 0; i < LEAF_COUNT; i++) {
    const depth = Math.pow(rand(), 1.25)       // 0 = al fondo y arriba, 1 = al frente y abajo
    put(leaves, {
      x: rand() * TILE,
      y: SPROUT_H + 2 + depth * 56,
      rot: -80 + rand() * 160,
      scale: 0.7 + rand() * 0.65,
      fill: GREENS[Math.min(GREENS.length - 1, Math.floor(depth * 4 + rand() * 2))]
    })
  }
  leaves.sort((a, b) => a.y - b.y)

  const draw = list => list.map(l =>
    `<use href="#lf-${id}" transform="translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${l.scale.toFixed(2)})" fill="${l.fill}"/>`
  ).join('')

  /* Manzanas repartidas al azar dentro de la repetición */
  const apples = []
  for (let i = 0; i < APPLE_COUNT; i++) {
    const r = 8.5 + rand() * 2.5
    apples.push({
      x: 20 + rand() * (TILE - 40),
      y: SPROUT_H + 54 + rand() * 24,
      r,
      stem: 8 + rand() * 8,
      color: APPLE_REDS[Math.floor(rand() * APPLE_REDS.length)]
    })
  }
  const fruit = apples.map(a => `
    <path d="M${a.x.toFixed(1)} ${(a.y - a.r - a.stem).toFixed(1)}v${a.stem.toFixed(1)}" stroke="#7A4A2A" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${a.r.toFixed(1)}" fill="${a.color}"/>
    <circle cx="${(a.x - a.r * 0.36).toFixed(1)}" cy="${(a.y - a.r * 0.36).toFixed(1)}" r="${(a.r * 0.28).toFixed(1)}" fill="#FFFFFF" opacity=".45"/>`).join('')

  return `<svg class="edge-svg" width="100%" height="${FOLIAGE_H}" aria-hidden="true" focusable="false">
    <defs>
      <path id="lf-${id}" d="M0 0c3-6 12-9 19-5 2 6-3 13-10 14-5 1-9-4-9-9z"/>
      <pattern id="${id}" width="${TILE}" height="${FOLIAGE_H}" patternUnits="userSpaceOnUse">
        ${draw(sprouts)}
        <g fill="#2E7231">
          <rect y="${SPROUT_H}" width="${TILE}" height="26"/>
          ${Array.from({ length: TILE / 32 + 1 }, (_, i) => `<circle cx="${i * 32}" cy="${SPROUT_H + 26 + (i % 2 ? 2 : 0)}" r="20"/>`).join('')}
        </g>
        ${draw(leaves)}
        ${fruit}
      </pattern>
    </defs>
    <rect width="100%" height="${FOLIAGE_H}" fill="url(#${id})"/>
  </svg>`
}

/** Hojas decorativas (SVG propio) */
export function leafDeco (color = '#7DB46C', cls = '') {
  return `<svg class="${cls}" viewBox="0 0 60 80" aria-hidden="true" focusable="false"><path d="M30 76C8 58 6 30 30 4c24 26 22 54 0 72z" fill="${color}"/><path d="M30 72V14" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/><path d="M30 34l10-8M30 48l12-9M30 48l-12-9M30 34l-10-8" stroke="rgba(255,255,255,.4)" stroke-width="2.4" stroke-linecap="round"/></svg>`
}
