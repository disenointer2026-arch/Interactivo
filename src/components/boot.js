import * as THREE from 'three'

/* ==========================================================================
   CAPA DE CARGA
   Misma interfaz que "Procesando tu pago": velo con desenfoque sobre la
   página, la hoja flotando y un mensaje. El marcado vive en index.html para
   que aparezca con el primer pintado; aquí solo se controla cuándo se va.
   ========================================================================== */

const SAFETY_MS = 15000   // por si algún recurso nunca responde
const MIN_MS = 2400       // mínimo en pantalla, para que no dé un parpadeo
const WELCOME_MS = 1000   // cuánto se queda el "¡Bienvenido/a!" antes de irse
const FADE_MS = 650       // debe coincidir con la transición de #boot

let el = null
let safety = null
let finished = false
let startedAt = 0

/* La portada espera a que se retire el velo para lanzar su animación de
   entrada; si no hay velo (al volver desde otra pantalla) no espera nada. */
let gone = null
let bootGone = null
export function whenBootDone () {
  return el && gone ? gone : Promise.resolve()
}

export function startBoot () {
  el = document.getElementById('boot')
  if (!el) return
  startedAt = performance.now()
  gone = new Promise(resolve => { bootGone = resolve })

  /* Se escucha la descarga de los .glb solo para saber que sigue viva */
  THREE.DefaultLoadingManager.onError = () => {}
  safety = setTimeout(finishBoot, SAFETY_MS)
}

/** La página ya está lista: saluda y desvanece la capa. */
export function finishBoot () {
  if (finished || !el) return
  finished = true
  clearTimeout(safety)

  const rest = Math.max(0, MIN_MS - (performance.now() - startedAt))
  setTimeout(() => {
    const title = el.querySelector('[data-boot-title]')
    const note = el.querySelector('[data-boot-note]')
    if (title) { title.textContent = '¡Bienvenido/a!'; title.classList.add('is-welcome') }
    if (note) note.textContent = 'Tu isla está lista'
    setTimeout(() => {
      el.classList.add('is-done')
      setTimeout(() => {
        el.remove()
        el = null
        /* Con el velo fuera, la portada ya puede lanzar su entrada */
        bootGone && bootGone()
      }, FADE_MS)
    }, WELCOME_MS)
  }, rest)
}
