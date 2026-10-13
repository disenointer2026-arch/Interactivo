import { INFO_PAGES, MENU } from '../data/content.js'
import { icon, leafDeco } from '../utils/icons.js'
import { esc } from '../utils/format.js'

/* Páginas del menú (Marca, Productos, Tiendas, Inversores, Responsabilidad social).
   Son páginas de apoyo del sitemap; el contenido se edita en data/content.js */
export const infoView = {
  name: 'info',
  mount (el, id) {
    const page = INFO_PAGES[id] || INFO_PAGES.marca
    el.innerHTML = `
      <section class="info wrap" aria-labelledby="info-title">
        <div class="info-card">
          <span class="info-leaf" aria-hidden="true">${leafDeco('#9ACB8A')}</span>
          <p class="eyebrow">MINISO</p>
          <h1 id="info-title">${esc(page.title)}</h1>
          <p>${esc(page.body)}</p>
          <a class="btn btn--primary" href="#/personalizar">${icon('sparkle')}<span>Personalizar mi avatar</span></a>
        </div>
        <nav class="info-nav" aria-label="Otras páginas">
          ${MENU.map(m => `<a href="#/info/${m.id}" ${m.id === id ? 'aria-current="page"' : ''}>${esc(m.label)}</a>`).join('')}
        </nav>
      </section>`
  }
}
