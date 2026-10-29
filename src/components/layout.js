import { SITE, HOME_NAV, MINISO_NAV, SECTIONS, FOOTER } from '../data/content.js'
import { icon } from '../utils/icons.js'
import { goSection } from '../utils/router.js'
import { sound } from '../utils/sound.js'
import { createDialog, openDialog, closeDialog } from './dialog.js'

/* ==========================================================================
   ENCABEZADO Y PIE DE PÁGINA
   El mismo encabezado (.hh-*), menú lateral y pie (.hf-*) en todas las pantallas.
   ========================================================================== */

/** Logotipo tipográfico de la colaboración (sin isotipos oficiales). */
export function lockup (size = '') {
  return `<span class="lockup ${size}" aria-label="MINISO por Animal Crossing" role="img">
    <span class="lk-miniso" aria-hidden="true">MINISO</span>
    <span class="lk-x" aria-hidden="true">×</span>
    <span class="lk-ac" aria-hidden="true">Animal Crossing</span>
  </span>`
}

/** Los enlaces a miniso.com salen en una pestaña nueva para no perder el prototipo. */
const out = href => href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''

export function renderHeader (el) {
  el.innerHTML = `
    <div class="hh-inner">
      <a class="hh-brand" href="#/" aria-label="Inicio: MINISO × Animal Crossing">
        <img class="hh-mark" src="images/logo-miniso.png" alt="" width="1000" height="1175" />
        <span class="sr-only">MINISO × Animal Crossing</span>
      </a>
      <nav class="hh-nav" aria-label="Principal">
        ${HOME_NAV.map(n => `<a class="hh-link" href="#/" data-section="${n.section}">${n.label}</a>`).join('')}
      </nav>
      <div class="hh-end">
        <button type="button" class="icon-btn hh-sound" data-sound></button>
        <button type="button" class="icon-btn hh-menu" data-open-menu aria-haspopup="dialog" aria-label="Abrir menú">${icon('menu')}</button>
      </div>
    </div>`

  /* Menú lateral (en pantallas estrechas sustituye a la navegación) */
  const drawer = createDialog({
    className: 'drawer drawer--home',
    label: 'Menú',
    html: `
      <div class="drawer-head">
        ${lockup()}
        <button type="button" class="icon-btn" data-close aria-label="Cerrar menú">${icon('close')}</button>
      </div>
      <nav aria-label="Menú del sitio">
        <p class="drawer-label">La colaboración</p>
        <ul class="drawer-list">
          ${SECTIONS.map(s => `<li><button type="button" data-section="${s.section}">${s.label}</button></li>`).join('')}
          <li><a href="#/personalizar">Personalización</a></li>
        </ul>
        <p class="drawer-label">MINISO</p>
        <ul class="drawer-list">
          ${MINISO_NAV.map(n => `<li><a href="${n.href}"${out(n.href)}>${n.label}</a></li>`).join('')}
        </ul>
      </nav>
      <a class="btn btn--primary btn--block btn--cta" href="#/personalizar">¡Hacer mi avatar!</a>`
  })

  /* Interruptor de sonido: música de ambiente + sonidos de la interfaz */
  const soundBtn = el.querySelector('[data-sound]')
  const paintSound = () => {
    const on = sound.enabled
    soundBtn.innerHTML = icon(on ? 'sound' : 'soundOff')
    soundBtn.setAttribute('aria-pressed', String(!on))
    soundBtn.setAttribute('aria-label', on ? 'Silenciar la música' : 'Activar la música')
    soundBtn.title = on ? 'Silenciar' : 'Activar sonido'
    soundBtn.classList.toggle('is-off', !on)
  }
  sound.onChange(paintSound)
  paintSound()

  el.addEventListener('click', e => {
    if (e.target.closest('[data-open-menu]')) openDialog(drawer)
    if (e.target.closest('[data-sound]')) sound.toggle()
  })
  drawer.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeDialog(drawer)
    const s = e.target.closest('[data-section]')
    if (s) closeDialog(drawer, () => goSection(s.dataset.section))
    if (e.target.closest('a')) closeDialog(drawer)
  })

  /* Los enlaces del encabezado bajan a su sección del inicio (desde otra página, primero vuelven al inicio) */
  el.querySelector('.hh-nav').addEventListener('click', e => {
    const a = e.target.closest('[data-section]')
    if (!a) return
    e.preventDefault()
    goSection(a.dataset.section)
  })

  /* Marca la sección del inicio que se está viendo (fuera del inicio no se marca ninguna) */
  const links = [...el.querySelectorAll('.hh-link')]
  const mark = () => {
    let current = null
    if (document.body.dataset.route === 'home') {
      const line = el.offsetHeight + 40
      links.forEach(a => {
        const sec = document.getElementById(a.dataset.section)
        if (sec && sec.getBoundingClientRect().top <= line) current = a
      })
      current = current || links[0]
    }
    links.forEach(a => a === current ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'))
  }
  window.addEventListener('hashchange', () => setTimeout(mark, 400))

  const onScroll = () => {
    el.classList.toggle('is-scrolled', window.scrollY > 8)
    mark()
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

export function renderFooter (el) {
  el.innerHTML = `
    <div class="hf">
      <img class="hf-mark" src="images/cara-miniso.png" alt="" aria-hidden="true" loading="lazy" />
      <div class="hf-inner">
        <div class="hf-brand">
          <img class="hf-logo" src="images/logo-miniso.png" alt="MINISO × Animal Crossing" width="1000" height="1175" />
          <p class="hf-inquiries">
            <span>${icon('store')}${FOOTER.inquiriesLabel}</span>
            <a href="#/" data-top>${FOOTER.email}</a>
          </p>
        </div>
        <nav class="hf-cols" aria-label="Pie de página">
          ${FOOTER.columns.map(c => `
            <div class="hf-col">
              <h2><a href="#/" data-top>${c.title}</a></h2>
              ${c.links.length ? `<ul>${c.links.map(l => `<li><a href="#/" data-top>${l}</a></li>`).join('')}</ul>` : ''}
            </div>`).join('')}
        </nav>
      </div>
      <div class="hf-legal">
        <div class="hf-legal-inner">
          <p class="hf-copy">${FOOTER.copyright}</p>
          <p>${SITE.disclaimer}</p>
        </div>
      </div>
    </div>`

  // Los enlaces del pie no salen del sitio: llevan a la parte superior del inicio
  el.addEventListener('click', e => {
    if (!e.target.closest('[data-top]')) return
    e.preventDefault()
    goSection('inicio')
  })
}

/** Botón flotante para volver arriba: aparece al empezar a desplazarse. */
export function renderBackToTop (host) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'to-top'
  btn.setAttribute('aria-label', 'Volver arriba')
  btn.innerHTML = icon('arrowUp')
  host.appendChild(btn)

  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  })

  const onScroll = () => btn.classList.toggle('is-on', window.scrollY > 240)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}
