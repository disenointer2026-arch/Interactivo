import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HOME, TESTIMONIALS, PEEK } from '../data/content.js'
import { sanitizeAvatar } from '../data/avatarOptions.js'
import { icon, leafDeco, foliage, FOLIAGE_H, SPROUT_H } from '../utils/icons.js'
import { esc, $, $$, REDUCED_MOTION } from '../utils/format.js'
import { store } from '../utils/store.js'
import { getStage } from '../three/Stage.js'
import { renderAvatar } from '../three/Snapshot.js'

gsap.registerPlugin(ScrollTrigger)

let stage = null
let ctx = null
let refreshTimer = null
let greetTimer = null
let greetBack = null
let hintTimer = null
let hintWatcher = null

function stopGreeting () {
  clearInterval(greetTimer)
  clearTimeout(greetBack)
  greetTimer = greetBack = null
}

/* Las imágenes (banner, fotos y retratos 3D) llegan después del primer pintado y
   mueven la página: hay que recalcular los disparadores de scroll cuando cargan. */
function scheduleRefresh () {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150)
}

/* Hojas sueltas que se mecen sobre el seto: posición en % y variante de ritmo. */
const SWAYING = [
  { x: 7, v: 0 }, { x: 19, v: 2 }, { x: 31, v: 1 }, { x: 44, v: 0 },
  { x: 57, v: 2 }, { x: 68, v: 1 }, { x: 81, v: 0 }, { x: 93, v: 2 }
]

/** Personajes asomados detrás del seto (se recortan por abajo). */
function peekers () {
  return `<div class="island-peek" aria-hidden="true">
    ${PEEK.map(p => `
      <span class="peek peek--${p.anim}${p.small ? '' : ' peek--wide'}"
            style="left:${p.x}%; bottom:${p.show - p.h}px; animation-delay:${p.delay}s">
        <img src="${p.src}" alt="" style="height:${p.h}px" loading="lazy" decoding="async" />
      </span>`).join('')}
  </div>`
}

/** Borde de seto (hojas + manzanas) con algunas hojas animadas.
    Se coloca de modo que la masa verde arranque justo en el borde de la sección
    y las hojas sueltas sobresalgan por fuera. */
function islandEdge (where) {
  const place = where === 'top' ? `top:${-SPROUT_H}px` : `bottom:${SPROUT_H - FOLIAGE_H}px`
  return `<span class="island-edge island-edge--${where}" style="${place}" aria-hidden="true">
    ${foliage(`foliage-${where}`)}
    ${SWAYING.map(l => `<span class="edge-leaf edge-leaf--${l.v}" style="left:${l.x}%">${leafDeco('#4C9B46')}</span>`).join('')}
  </span>`
}

function template () {
  const b = HOME.banner
  const c = HOME.build
  const l = HOME.band
  const is = HOME.island
  const t = HOME.testimonials
  return `
  <h1 class="sr-only">MINISO × Animal Crossing — ${esc(b.title)}</h1>

  <section class="banner" aria-label="${esc(b.title)}">
    <img class="banner-img" src="${b.src}" alt="${esc(b.alt)}" fetchpriority="high" decoding="async" />
  </section>

  <section id="colaboracion" class="build" aria-labelledby="build-title">
    <img class="build-blob" src="${c.face.src}" alt="" aria-hidden="true" loading="lazy" decoding="async" />
    <div class="wrap build-grid">
      <div class="build-copy">
        <h2 id="build-title" class="build-title">${esc(c.title)}</h2>
        <p>${esc(c.text)}</p>
        <p>${esc(c.text2)}</p>
        <a class="btn btn--primary btn--lg btn--cta" href="#/personalizar">${esc(c.cta)}</a>
      </div>
      <div class="build-visual">
        <div class="build-stage stage-mount" id="heroStage">
          <div class="stage-loading" aria-hidden="true">${icon('leaf')}</div>
        </div>
        <div class="drag-hint" aria-hidden="true">
          <span class="drag-row">
            ${icon('arrowLeft', 'drag-arrow drag-arrow--l')}
            <img class="drag-hand" src="images/gesto-arrastrar.png" alt="" loading="lazy" />
            ${icon('arrowRight', 'drag-arrow drag-arrow--r')}
          </span>
          <p>${esc(c.dragHint)}</p>
        </div>
        <p class="build-hint">${icon('rotate')}<span>${esc(c.hint)}</span></p>
        <div class="float float--a" aria-hidden="true">${leafDeco('#8CC37A')}</div>
        <div class="float float--b" aria-hidden="true">${leafDeco('#F2A7B8')}</div>
      </div>
    </div>
  </section>

  <section class="photo-band" aria-labelledby="photo-title" aria-roledescription="carrusel">
    ${l.slides.map((s, i) => `
      <img class="pb-slide${i === 0 ? ' is-on' : ''}" src="${s.src}" alt="${esc(s.alt)}" ${i === 0 ? '' : 'loading="lazy"'} decoding="async" />`).join('')}
    <div class="photo-band-copy">
      <p class="pb-kicker">${esc(l.kicker)}</p>
      <h2 id="photo-title">${esc(l.title)}</h2>
      <a class="btn btn--lg btn--cta" href="#/personalizar">${esc(l.cta)}</a>
    </div>
    <button type="button" class="pb-nav pb-nav--prev" data-step="-1" aria-label="Imagen anterior">${icon('arrowLeft')}</button>
    <button type="button" class="pb-nav pb-nav--next" data-step="1" aria-label="Imagen siguiente">${icon('arrowRight')}</button>
    <div class="pb-dots">
      ${l.slides.map((s, i) => `<button type="button" class="pb-dot${i === 0 ? ' is-on' : ''}" data-go="${i}" aria-label="Ver imagen ${i + 1} de ${l.slides.length}"></button>`).join('')}
    </div>
  </section>

  <section id="como-funciona" class="island" aria-labelledby="island-title">
    ${islandEdge('top')}
    <div class="wrap island-inner">
      <header class="section-head section-head--center">
        <h2 id="island-title">${esc(is.title)}</h2>
        <p>${esc(is.text)}</p>
      </header>
      <ol class="journey">
        ${is.steps.map((s, i) => `
          <li class="journey-step">
            <span class="journey-num" aria-hidden="true">${i + 1}</span>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.text)}</p>
          </li>`).join('')}
      </ol>
    </div>
    ${peekers()}
    ${islandEdge('bottom')}
  </section>

  <section id="testimonios" class="testimonials" aria-labelledby="t-title">
    <div class="wrap">
      <header class="section-head section-head--center">
        <h2 id="t-title">${esc(t.title)}</h2>
      </header>
      <div class="t-carousel">
        <button type="button" class="t-nav t-nav--prev" data-slide="-1" aria-label="Testimonios anteriores">${icon('arrowLeft')}</button>
        <ul class="t-track" tabindex="0" aria-label="Testimonios, desplázate horizontalmente">
          ${TESTIMONIALS.map((p, i) => `
            <li class="t-card">
              <figure>
                <div class="t-portrait"><img data-t="${i}" alt="Avatar de ${esc(p.name)}" /></div>
                <blockquote><p>${esc(p.quote)}</p></blockquote>
                <figcaption><strong>${esc(p.name)}</strong><span>${esc(p.place)}</span></figcaption>
              </figure>
            </li>`).join('')}
        </ul>
        <button type="button" class="t-nav t-nav--next" data-slide="1" aria-label="Testimonios siguientes">${icon('arrowRight')}</button>
      </div>
    </div>
  </section>

  <section class="closing" aria-label="Empieza tu avatar">
    <div class="wrap closing-inner">
      <a class="btn btn--primary btn--lg btn--cta" href="#/personalizar">${esc(t.cta)}</a>
      <img class="closing-avatar" data-closing alt="" />
    </div>
  </section>`
}

/* Avatar del cierre: asoma por detrás del pie de página y cada cierto rato
   cambia a una versión sonriente mientras saluda. */
async function closingAvatar (root) {
  const el = $('[data-closing]', root)
  if (!el) return
  const calm = await renderAvatar(store.state, { width: 420, height: 560, framing: 'full' })
  if (!calm || !root.isConnected) return
  el.src = calm
  gsap.fromTo(el, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })

  if (REDUCED_MOTION) return
  const happy = await renderAvatar({ ...store.state, mouth: 'open', eyes: 'happy' }, { width: 420, height: 560, framing: 'full' })
  if (!happy || !root.isConnected) return
  greetTimer = setInterval(() => {
    if (!el.isConnected) return stopGreeting()
    el.src = happy
    el.classList.add('is-greeting')
    greetBack = setTimeout(() => { el.src = calm; el.classList.remove('is-greeting') }, 2400)
  }, 8000)
}

async function loadPortraits (root) {
  for (let i = 0; i < TESTIMONIALS.length; i++) {
    if (!root.isConnected) return
    const url = await renderAvatar(sanitizeAvatar(TESTIMONIALS[i].avatar), { width: 280, height: 280, framing: 'bust' })
    const img = $(`img[data-t="${i}"]`, root)
    if (img && url) { img.src = url; gsap.fromTo(img, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5 }) }
    await new Promise(r => requestAnimationFrame(r))
  }
}

function bannerIntro (root) {
  gsap.from($('.banner-img', root), { scale: 1.04, autoAlpha: 0, duration: 1, ease: 'power2.out' })
}

function scrollReveals (root) {
  const reveal = (targets, trigger, vars = {}) => {
    const els = $$(targets, root)
    if (!els.length || !trigger) return
    gsap.from(els, {
      y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger, start: 'top 82%', once: true }, ...vars
    })
  }

  /* Los botones principales entran solo con opacidad: su hover usa "transform"
     y, si la entrada los dejara desplazados, saltarían al pasar el mouse. */
  reveal('.build-copy > :not(.btn)', $('.build', root))
  reveal('.build-copy > .btn', $('.build', root), { y: 0, stagger: 0 })
  reveal('.build-visual', $('.build', root), { y: 0, scale: 0.95, duration: 0.9, stagger: 0 })
  reveal('.photo-band-copy', $('.photo-band', root))
  reveal('.journey-step', $('.journey', root), { stagger: 0.14 })
  reveal('.t-card', $('.t-carousel', root), { stagger: 0.08 })
  reveal('.closing-inner > :not(.btn)', $('.closing', root))
  reveal('.closing-inner > .btn', $('.closing', root), { y: 0, stagger: 0 })

  if (!REDUCED_MOTION) {
    $$('.float', root).forEach((el, i) => {
      gsap.to(el, { y: i % 2 ? -10 : 10, rotation: i % 2 ? 6 : -6, duration: 3 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    })
  }
}

/* Aviso "mueve la visualización": aparece cada vez que la escena 3D entra en
   pantalla (bajando o subiendo) y se va al interactuar o a los pocos segundos. */
function dragHint (root) {
  const visual = $('.build-visual', root)
  const hint = $('.drag-hint', root)
  if (!visual || !hint) return

  const hide = () => {
    clearTimeout(hintTimer)
    visual.classList.remove('is-hinting')
  }
  const show = () => {
    clearTimeout(hintTimer)
    visual.classList.add('is-hinting')
    hintTimer = setTimeout(hide, 4000)
  }

  /* IntersectionObserver en vez de ScrollTrigger: avisa igual de bien al bajar
     que al subir, sin depender del refresco de las animaciones. */
  hintWatcher = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) show()
    else hide()
  }, { threshold: 0.45 })
  hintWatcher.observe(visual)

  /* Si ya está arrastrando, el aviso sobra */
  visual.addEventListener('pointerdown', hide)
}

/** Testimonios: una fila de tres y flechas para ver el resto. */
function testimonialCarousel (root) {
  const track = $('.t-track', root)
  const prev = $('.t-nav--prev', root)
  const next = $('.t-nav--next', root)
  if (!track || !prev || !next) return

  /* Da la vuelta al llegar al extremo, así las dos flechas siempre hacen algo. */
  const go = dir => {
    const max = track.scrollWidth - track.clientWidth
    const next = track.scrollLeft + track.clientWidth * dir
    const left = next > max + 2 ? 0 : next < -2 ? max : next
    track.scrollTo({ left, behavior: REDUCED_MOTION ? 'auto' : 'smooth' })
  }

  prev.addEventListener('click', () => go(-1))
  next.addEventListener('click', () => go(1))
}

/** Carrusel de la banda fotográfica: flechas, puntos y teclado. */
function bandSlider (root) {
  const band = $('.photo-band', root)
  if (!band) return
  const slides = $$('.pb-slide', band)
  const dots = $$('.pb-dot', band)
  if (slides.length < 2) return
  let at = 0

  const show = n => {
    at = (n + slides.length) % slides.length
    slides.forEach((s, i) => s.classList.toggle('is-on', i === at))
    dots.forEach((d, i) => d.classList.toggle('is-on', i === at))
  }

  band.addEventListener('click', e => {
    const step = e.target.closest('[data-step]')
    if (step) return show(at + Number(step.dataset.step))
    const go = e.target.closest('[data-go]')
    if (go) show(Number(go.dataset.go))
  })
  band.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(at - 1)
    if (e.key === 'ArrowRight') show(at + 1)
  })
}

export const homeView = {
  name: 'home',
  async mount (el) {
    el.innerHTML = template()
    const root = el
    ctx = gsap.context(() => {
      bannerIntro(root)
      scrollReveals(root)
    }, root)
    bandSlider(root)
    testimonialCarousel(root)
    dragHint(root)
    $$('img', root).forEach(img => img.addEventListener('load', scheduleRefresh))

    stage = await getStage(store.state)
    const mount = $('#heroStage', root)
    if (stage && mount && root.isConnected) {
      await stage.avatar.apply(store.state)
      stage.attach(mount, 'showcase')
      $('.stage-loading', mount)?.remove()
    } else if (mount) {
      mount.innerHTML = '<p class="stage-fallback">Tu navegador no pudo iniciar la vista 3D. Puedes seguir explorando la colaboración.</p>'
    }
    closingAvatar(root)
    loadPortraits(root)
  },
  unmount () {
    clearTimeout(refreshTimer)
    clearTimeout(hintTimer)
    hintWatcher && hintWatcher.disconnect()
    hintWatcher = null
    stopGreeting()
    ctx && ctx.revert()
    ScrollTrigger.getAll().forEach(st => st.kill())
    stage && stage.detach()
  }
}
