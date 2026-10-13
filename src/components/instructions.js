import gsap from 'gsap'
import { icon } from '../utils/icons.js'
import { createDialog, openDialog, closeDialog } from './dialog.js'

/* Modal "¿Cómo funciona?" — aparece la primera vez que se entra al estudio.
   No es obligatorio: se puede cerrar con la X, con Escape o con "Comenzar". */

const STEPS = [
  { icon: 'sparkle', title: 'Personaliza tu avatar', text: 'Toca una opción y mira cómo cambia al instante.' },
  { icon: 'shirt', title: 'Explora las categorías', text: 'Cuerpo, cabello, rostro, ropa, accesorios y objetos.' },
  { icon: 'save', title: 'Guarda tu creación', text: 'Queda guardada en este navegador para volver cuando quieras.' },
  { icon: 'bag', title: 'Decide qué sigue', text: 'Pide tu producto físico o crea tu tarjeta coleccionable.' }
]

let dialog = null

export function openInstructions (onClose) {
  if (!dialog) {
    dialog = createDialog({
      className: 'modal--intro',
      label: '¿Cómo funciona?',
      html: `
        <button type="button" class="icon-btn modal-close" data-close aria-label="Cerrar instrucciones">${icon('close')}</button>
        <p class="modal-kicker">Bienvenida al estudio</p>
        <h2 class="modal-title">¿Cómo funciona?</h2>
        <ol class="intro-steps">
          ${STEPS.map((s, i) => `
            <li class="intro-step">
              <span class="intro-num" aria-hidden="true">${i + 1}</span>
              <span class="intro-icon" aria-hidden="true">${icon(s.icon)}</span>
              <span class="intro-copy"><strong>${s.title}</strong><span>${s.text}</span></span>
            </li>`).join('')}
        </ol>
        <p class="intro-tip">${icon('rotate')}<span>Arrastra la escena para girar a tu avatar y usa la rueda para acercarte.</span></p>
        <button type="button" class="btn btn--primary btn--block btn--lg" data-close data-start>Comenzar</button>`
    })
    dialog.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) closeDialog(dialog)
    })
  }
  dialog.onclose = () => { onClose && onClose(); dialog.onclose = null }
  openDialog(dialog)
  gsap.from(dialog.querySelectorAll('.intro-step'), { x: -12, autoAlpha: 0, stagger: 0.08, duration: 0.4, delay: 0.15, ease: 'power2.out' })
  requestAnimationFrame(() => dialog.querySelector('[data-start]').focus())
}

/** Cierra el modal si se sale del estudio mientras está abierto. */
export function closeInstructions () {
  if (dialog && dialog.open) closeDialog(dialog)
}
