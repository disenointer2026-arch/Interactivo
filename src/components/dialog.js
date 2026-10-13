import gsap from 'gsap'

/* Ventanas modales accesibles basadas en <dialog> nativo
   (manejo de foco y tecla Escape incluidos por el navegador). */

export function createDialog ({ className = '', label = '', html = '' }) {
  const d = document.createElement('dialog')
  d.className = `modal ${className}`
  if (label) d.setAttribute('aria-label', label)
  d.innerHTML = `<div class="modal-card">${html}</div>`
  document.body.appendChild(d)

  // Cerrar al hacer clic fuera de la tarjeta
  d.addEventListener('click', e => { if (e.target === d) closeDialog(d) })
  d.addEventListener('cancel', e => { e.preventDefault(); closeDialog(d) })
  return d
}

export function openDialog (d) {
  if (d.open) return
  d.showModal()
  const card = d.querySelector('.modal-card')
  gsap.fromTo(d, { backgroundColor: 'rgba(58,46,40,0)' }, { backgroundColor: 'rgba(58,46,40,0.42)', duration: 0.3 })
  gsap.fromTo(card, { y: 24, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(1.5)' })
}

export function closeDialog (d, after) {
  if (!d.open) return
  const card = d.querySelector('.modal-card')
  gsap.to(d, { backgroundColor: 'rgba(58,46,40,0)', duration: 0.22 })
  gsap.to(card, {
    y: 16, scale: 0.97, autoAlpha: 0, duration: 0.22, ease: 'power1.in',
    onComplete: () => { d.close(); after && after() }
  })
}
