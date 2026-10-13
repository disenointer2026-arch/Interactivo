import gsap from 'gsap'
import { icon } from '../utils/icons.js'

/* Mensajes breves de confirmación (se anuncian a lectores de pantalla). */
let region = null

export function toast (message, { iconName = 'check', duration = 2600 } = {}) {
  if (!region) {
    region = document.createElement('div')
    region.className = 'toast-region'
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', 'polite')
    document.body.appendChild(region)
  }
  const el = document.createElement('div')
  el.className = 'toast'
  el.innerHTML = `${icon(iconName)}<span>${message}</span>`
  region.appendChild(el)
  gsap.fromTo(el, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'back.out(1.6)' })
  gsap.to(el, { y: -8, autoAlpha: 0, duration: 0.3, delay: duration / 1000, onComplete: () => el.remove() })
}
