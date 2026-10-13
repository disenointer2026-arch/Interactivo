import { NAV, MENU, SITE, HOME_NAV, SECTIONS, FOOTER } from '../data/content.js'
import { icon } from '../utils/icons.js'
import { goSection } from '../utils/router.js'
import { sound } from '../utils/sound.js'
import { createDialog, openDialog, closeDialog } from './dialog.js'

/* ==========================================================================
   ENCABEZADO Y PIE DE PÁGINA
   Hay dos versiones de cada uno y el CSS muestra la que toca según la ruta
   (body[data-route]):
     · inicio  → .hh-* (encabezado) y .hf-* (pie): diseño nuevo del inicio
     · resto   → .header-inner y .footer-inner: estudio, pedido, tarjeta…
   Usan clases distintas para que los estilos de una no afecten a la otra.
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
    <div class="header-inner">
      <a class="header-brand" href="#/" aria-label="Inicio: MINISO por Animal Crossing">${lockup()}</a>
      <nav class="header-nav" aria-label="Principal">
        ${NAV.map(n => `<button type="button" class="nav-link" data-section="${n.section}">${n.label}</button>`).join('')}
        <button type="button" class="nav-link nav-menu" data-open-menu="app" aria-haspopup="dialog">${icon('menu')}<span>Menú</span></button>
      </nav>
      <a class="header-cta" href="#/personalizar">${icon('sparkle')}<span>Personalizar</span></a>
    </div>

    <div class="hh-inner">
      <a class="hh-brand" href="#/" aria-label="Inicio: MINISO × Animal Crossing">
        <img class="hh-mark" src="images/logo-miniso.png" alt="" width="1000" height="1175" />
        <span class="sr-only">MINISO × Animal Crossing</span>
      </a>
      <nav class="hh-nav" aria-label="Principal">
        ${HOME_NAV.map(n => `<a class="hh-link" href="${n.href}" data-href="${n.href}"${out(n.href)}>${n.label}</a>`).join('')}
      </nav>
      <div class="hh-end">
        <button type="button" class="icon-btn hh-sound" data-sound></button>
        <button type="button" class="icon-btn hh-menu" data-open-menu="home" aria-haspopup="dialog" aria-label="Abrir menú">${icon('menu')}</button>
      </div>
    </div>`

  /* Menú lateral de las pantallas internas */
  const appDrawer = createDialog({
    className: 'drawer',
    label: 'Menú',
    html: `
      <div class="drawer-head">
        ${lockup()}
        <button type="button" class="icon-btn" data-close aria-label="Cerrar menú">${icon('close')}</button>
      </div>
      <nav aria-label="Menú del sitio">
        <p class="drawer-label">La colaboración</p>
        <ul class="drawer-list">
          ${NAV.map(n => `<li><button type="button" data-section="${n.section}">${n.label}</button></li>`).join('')}
          <li><a href="#/personalizar">Personalización</a></li>
        </ul>
        <p class="drawer-label">MINISO</p>
        <ul class="drawer-list">
          ${MENU.map(m => `<li><a href="#/info/${m.id}">${m.label}</a></li>`).join('')}
        </ul>
      </nav>
      <a class="btn btn--primary btn--block" href="#/personalizar">Personalizar mi avatar</a>`
  })

  /* Menú lateral del inicio */
  const homeDrawer = createDialog({
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
          ${HOME_NAV.filter(n => n.href.startsWith('http')).map(n => `<li><a href="${n.href}"${out(n.href)}>${n.label}</a></li>`).join('')}
        </ul>
      </nav>
      <a class="btn btn--primary btn--block btn--cta" href="#/personalizar">¡Hacer mi avatar!</a>`
  })

  /* Interruptor de sonido del inicio: música de ambiente + sonidos de la interfaz */
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
    const s = e.target.closest('[data-section]')
    if (s) goSection(s.dataset.section)
    const menu = e.target.closest('[data-open-menu]')
    if (menu) openDialog(menu.dataset.openMenu === 'home' ? homeDrawer : appDrawer)
    if (e.target.closest('[data-sound]')) sound.toggle()
  })
  ;[appDrawer, homeDrawer].forEach(drawer => {
    drawer.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) closeDialog(drawer)
      const s = e.target.closest('[data-section]')
      if (s) closeDialog(drawer, () => goSection(s.dataset.section))
      if (e.target.closest('a')) closeDialog(drawer)
    })
  })

  /* Marca el enlace de la página actual en el encabezado del inicio */
  const mark = () => {
    const hash = location.hash || '#/'
    el.querySelectorAll('.hh-link').forEach(a => {
      const on = a.dataset.href === hash || (a.dataset.href === '#/' && hash === '#')
      if (on) a.setAttribute('aria-current', 'page')
      else a.removeAttribute('aria-current')
    })
  }
  window.addEventListener('hashchange', mark)
  mark()

  const onScroll = () => el.classList.toggle('is-scrolled', window.scrollY > 8)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}

export function renderFooter (el) {
  el.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">${lockup()}<p>${SITE.disclaimer}</p></div>
      <nav class="footer-nav" aria-label="Pie de página">
        ${MENU.map(m => `<a href="#/info/${m.id}">${m.label}</a>`).join('')}
      </nav>
    </div>

    <div class="hf">
      <img class="hf-mark" src="images/cara-miniso.png" alt="" aria-hidden="true" loading="lazy" />
      <div class="hf-inner">
        <div class="hf-brand">
          <img class="hf-logo" src="images/logo-miniso.png" alt="MINISO × Animal Crossing" width="1000" height="1175" />
          <p class="hf-inquiries">
            <span>${icon('store')}${FOOTER.inquiriesLabel}</span>
            <a href="mailto:${FOOTER.email}">${FOOTER.email}</a>
          </p>
        </div>
        <nav class="hf-cols" aria-label="Pie de página">
          ${FOOTER.columns.map(c => `
            <div class="hf-col">
              <h2>${c.href ? `<a href="${c.href}"${out(c.href)}>${c.title}</a>` : c.title}</h2>
              ${c.links.length ? `<ul>${c.links.map(l => `<li><a href="${l.href}"${out(l.href)}>${l.label}</a></li>`).join('')}</ul>` : ''}
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
