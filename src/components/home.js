import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HOME, TESTIMONIALS, HERO_AVATARS } from '../data/content.js'
import { sanitizeAvatar } from '../data/avatarOptions.js'
import { icon } from '../utils/icons.js'
import { esc, $, $$, REDUCED_MOTION } from '../utils/format.js'
import { store } from '../utils/store.js'
import { getStage } from '../three/Stage.js'
import { renderAvatar } from '../three/Snapshot.js'
import { goSection } from '../utils/router.js'
import { whenBootDone } from './boot.js'

gsap.registerPlugin(ScrollTrigger)

let stage = null
let ctx = null
let refreshTimer = null
let hintTimer = null
let swapTimer = null
let onScrollDown = null
let heroRun = 0
const HERO_HOLD_MS = 1000   // cuánto se queda de frente cada avatar antes de girar
const HERO_INTRO_MS = 1600  // la entrada del primer avatar (ver Stage.playHeroIntro)

/* Los retratos 3D llegan después del primer pintado y mueven la página: hay que
   recalcular los disparadores de scroll cuando cargan. */
function scheduleRefresh () {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150)
}

function template () {
  const b = HOME.banner
  const c = HOME.build
  const t = HOME.testimonials
  return `
  <h1 class="sr-only">MINISO × Animal Crossing — ${esc(b.title)}</h1>

  <section id="inicio" class="hero3d" aria-label="${esc(b.title)}">
    <div class="hero3d-bg" aria-hidden="true"></div>
    <p class="hero3d-word" aria-hidden="true">${esc(b.word)}</p>
    <div class="hero3d-visual">
      <div class="hero3d-stage stage-mount" id="heroIsland">
        <div class="stage-loading" aria-hidden="true">${icon('leaf')}</div>
      </div>
      <p class="build-hint hero3d-hint">${icon('rotate')}<span>${esc(b.hint)}</span></p>
    </div>
    <button type="button" class="hero3d-down hero3d-down--left" data-to-collab aria-label="Ir a la colaboración">${icon('arrowDown')}</button>
    <button type="button" class="hero3d-down hero3d-down--right" data-to-collab aria-label="Ir a la colaboración">${icon('arrowDown')}</button>
  </section>

  <section id="colaboracion" class="build" aria-labelledby="build-title">
    <div class="wrap build-copy">
      <h2 id="build-title" class="build-title">${esc(c.title)}</h2>
      <p>${esc(c.text)}</p>
      <a class="btn btn--primary btn--lg btn--cta" href="#/personalizar">${esc(c.cta)}</a>
    </div>
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
    </div>
  </section>`
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
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.from($('.hero3d-word', root), { y: 26, autoAlpha: 0, duration: 0.9 })
    .from($('.hero3d-visual', root), { scale: 0.94, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, 0.1)
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
  reveal('.t-card', $('.t-carousel', root), { stagger: 0.08 })
  reveal('.closing-inner > .btn', $('.closing', root), { y: 0, stagger: 0 })
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

export const homeView = {
  name: 'home',
  async mount (el) {
    el.innerHTML = template()
    const root = el
    ctx = gsap.context(() => {
      bannerIntro(root)
      scrollReveals(root)
    }, root)
    testimonialCarousel(root)
    /* Las flechas de las esquinas llevan a "La colaboración" y se esconden en cuanto
       la página empieza a bajar */
    const downs = $$('[data-to-collab]', root)
    downs.forEach(b => b.addEventListener('click', () => goSection('colaboracion')))
    onScrollDown = () => downs.forEach(b => b.classList.toggle('is-hidden', window.scrollY > 40))
    window.addEventListener('scroll', onScrollDown, { passive: true })
    onScrollDown()
    /* El aviso de arrastrar se retira solo; también al primer arrastre */
    const hint = $('.hero3d-hint', root)
    const visual = $('.hero3d-visual', root)
    if (hint) {
      const drop = () => { clearTimeout(hintTimer); hint.classList.add('is-gone') }
      hintTimer = setTimeout(drop, 7000)
      visual && visual.addEventListener('pointerdown', drop, { once: true })
    }
    $$('img', root).forEach(img => img.addEventListener('load', scheduleRefresh))

    stage = await getStage(store.state)
    const mount = $('#heroIsland', root)
    if (stage && mount && root.isConnected) {
      /* Sin charm: ni el que colgaba de la cadena ni el que acompaña al avatar
         en el suelo (quedaban encima del personaje y lo tapaban). */
      const looks = HERO_AVATARS.map(a => ({ ...sanitizeAvatar(a), companion: 'none' }))
      /* Se prueban todos antes de mostrar la portada: así sus piezas ya están
         cargadas y el cambio de uno a otro es instantáneo. */
      stage.avatar.instantColors = true
      let top = 0
      for (const look of looks) {
        await stage.avatar.apply(look)
        top = Math.max(top, stage.measureAvatarTop())
      }
      stage.heroTop = top   // el encuadre de la portada cuenta con el avatar más alto
      await stage.avatar.apply(looks[0])
      stage.attach(mount, 'hero')
      $('.stage-loading', mount)?.remove()
      /* La entrada del personaje espera a que se retire la capa de carga,
         si no se la perdería detrás del velo. */
      whenBootDone().then(() => { if (root.isConnected) stage.playHeroIntro() })
      /* Ciclo de la portada: el personaje se queda de frente, cambia de avatar,
         da una vuelta completa y vuelve al frente; y así sucesivamente. */
      const run = ++heroRun
      const alive = () => heroRun === run && root.isConnected
      const wait = ms => new Promise(r => { swapTimer = setTimeout(r, ms) })
      ;(async () => {
        await whenBootDone()
        await wait(HERO_INTRO_MS)
        let n = 0
        while (alive()) {
          await wait(HERO_HOLD_MS)
          if (!alive()) break
          await stage.heroSpin()
          if (!alive()) break
          n = (n + 1) % looks.length
          await stage.avatar.apply(looks[n])
        }
      })()
    } else if (mount) {
      mount.innerHTML = '<p class="stage-fallback">Tu navegador no pudo iniciar la vista 3D. Puedes seguir explorando la colaboración.</p>'
    }
    loadPortraits(root)
  },
  unmount () {
    clearTimeout(refreshTimer)
    clearTimeout(hintTimer)
    heroRun++
    if (onScrollDown) window.removeEventListener('scroll', onScrollDown)
    onScrollDown = null
    clearTimeout(swapTimer)
    if (stage) stage.avatar.instantColors = false
    ctx && ctx.revert()
    ScrollTrigger.getAll().forEach(st => st.kill())
    stage && stage.detach()
  }
}
