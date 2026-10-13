const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export const cop = n => COP.format(n)

/** Escapa texto para insertarlo en HTML de forma segura. */
export function esc (s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** Hash numérico simple (para números de serie y pedido ficticios). */
export function hashString (s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export const $ = (sel, el = document) => el.querySelector(sel)
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)]

export const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches
