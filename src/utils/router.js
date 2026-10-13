import gsap from 'gsap'

/* Router por hash (#/ruta). Cada vista exporta { mount(el, param), unmount() }.
   Se usa hash para que el prototipo funcione en cualquier servidor estático. */

const routes = new Map()
let current = null
let outlet = null
let pendingSection = null
let busy = Promise.resolve()

export function route (path, view) { routes.set(path, view) }

export function go (path) {
  if (location.hash === '#' + path) render()
  else location.hash = path
}

/** Ir a una sección del inicio (Colaboración, Testimonios) desde cualquier página. */
export function goSection (id) {
  const onHome = !location.hash || location.hash === '#/' || location.hash === '#'
  if (onHome) scrollToSection(id)
  else { pendingSection = id; go('/') }
}

function scrollToSection (id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function parse () {
  const raw = (location.hash || '#/').slice(1) || '/'
  const parts = raw.split('/').filter(Boolean)
  const base = '/' + (parts[0] || '')
  return { base, param: parts[1] || null }
}

function render () {
  busy = busy.then(swap).catch(err => console.error(err))
}

async function swap () {
  const { base, param } = parse()
  const view = routes.get(base) || routes.get('/')
  document.body.dataset.route = view.name || base.slice(1) || 'home'

  if (current) {
    await gsap.to(outlet, { autoAlpha: 0, y: 8, duration: 0.22, ease: 'power1.in' })
    current.unmount && current.unmount()
  }
  outlet.innerHTML = ''
  window.scrollTo(0, 0)
  current = view
  await view.mount(outlet, param)
  gsap.fromTo(outlet, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  const h1 = outlet.querySelector('h1')
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }) }
  if (pendingSection) {
    const id = pendingSection
    pendingSection = null
    requestAnimationFrame(() => setTimeout(() => scrollToSection(id), 60))
  }
}

export function startRouter (el) {
  outlet = el
  window.addEventListener('hashchange', render)
  render()
}
