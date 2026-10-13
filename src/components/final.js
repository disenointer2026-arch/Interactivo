import gsap from 'gsap'
import { getOptionName, getGroup } from '../data/avatarOptions.js'
import { icon, leafDeco } from '../utils/icons.js'
import { esc, $, $$, REDUCED_MOTION } from '../utils/format.js'
import { store } from '../utils/store.js'
import { sound } from '../utils/sound.js'
import { getStage } from '../three/Stage.js'

/* ==========================================================================
   VISTA FINAL — momento de contemplación
   Avatar grande y girable + resumen + dos caminos equivalentes.
   ========================================================================== */

let stage = null

/** Resumen legible de las decisiones (se omiten colores y opciones "Nada"). */
export function summaryItems (state) {
  const rows = [
    ['Cabello', getOptionName('hair', state.hair)],
    ['Ojos', getOptionName('eyes', state.eyes)],
    ['Nariz', getOptionName('nose', state.nose)],
    ['Boca', getOptionName('mouth', state.mouth)],
    ['Parte superior', getOptionName('shirt', state.shirt)],
    ['Parte inferior', getOptionName('pants', state.pants)],
    ['Zapatos', getOptionName('shoes', state.shoes)]
  ]
  rows.push(['Llavero', state.companion === 'none' ? 'Ninguno' : getOptionName('companion', state.companion)])
  return rows
}

function colorDots (state) {
  const keys = ['skin', 'hairColor']
  return keys.map(k => {
    const g = getGroup(k)
    const name = g.options.find(o => o.id === state[k])?.name || state[k]
    return `<li><span class="dot" style="--c:${state[k]}"></span><span>${esc(g.label)}: ${esc(name)}</span></li>`
  }).join('')
}

function template () {
  const s = store.state
  const name = store.profile.name
  return `
  <section class="final" aria-labelledby="final-title">
    <div class="final-stage">
      <div class="stage-mount" id="finalStage"><div class="stage-loading" aria-hidden="true">${icon('leaf')}</div></div>
      <div class="final-confetti" aria-hidden="true"></div>
      <div class="camera-bar toolbar toolbar--float" role="toolbar" aria-label="Cámara">
        <button type="button" class="tool" data-act="spin" aria-pressed="true" aria-label="Girar automáticamente">${icon('rotate')}<span class="tool-label">360°</span></button>
        <button type="button" class="tool" data-act="zoomOut" aria-label="Alejar">${icon('zoomOut')}</button>
        <button type="button" class="tool" data-act="zoomIn" aria-label="Acercar">${icon('zoomIn')}</button>
      </div>
    </div>

    <div class="final-panel">
      <p class="eyebrow">${icon('sparkle')} Contempla tu creación</p>
      <h1 id="final-title" class="final-title">¡Tu avatar está listo!</h1>
      <p class="final-lead">Cada detalle lo decidiste tú. Gíralo, míralo con calma y elige cómo quieres llevarlo contigo.</p>

      <label class="field">
        <span class="field-label">Ponle nombre</span>
        <input class="input" id="avatarName" type="text" maxlength="18" autocomplete="off" placeholder="Tu avatar" value="${esc(name)}" />
      </label>

      <details class="summary-box" open>
        <summary>Resumen de tu avatar</summary>
        <dl class="summary-list">
          ${summaryItems(s).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
        </dl>
        <ul class="color-list" aria-label="Colores elegidos">${colorDots(s)}</ul>
      </details>

      <div class="choice-row">
        <a class="btn btn--choice" href="#/pedido">
          <span class="choice-icon">${icon('bag')}</span>
          <span class="choice-copy"><strong>Pedir mi producto</strong><span>Figura con cadena y base de acrílico</span></span>
        </a>
        <a class="btn btn--choice" href="#/tarjeta">
          <span class="choice-icon">${icon('card')}</span>
          <span class="choice-copy"><strong>Crear tarjeta Amiibo</strong><span>Coleccionable digital para compartir</span></span>
        </a>
      </div>
      <a class="btn btn--quiet final-back" href="#/personalizar">${icon('edit')}<span>Seguir editando</span></a>
    </div>
  </section>`
}

function confetti (root) {
  if (REDUCED_MOTION) return
  const box = $('.final-confetti', root)
  const colors = ['#7DB46C', '#9ACB8A', '#F2A7B8', '#F6D365', '#E60012']
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span')
    el.className = 'confetti-leaf'
    el.innerHTML = leafDeco(colors[i % colors.length])
    box.appendChild(el)
    gsap.fromTo(el,
      { x: () => gsap.utils.random(-40, 40) + '%', left: gsap.utils.random(10, 90) + '%', y: -40, rotation: gsap.utils.random(-90, 90), autoAlpha: 1, scale: gsap.utils.random(0.5, 1) },
      { y: () => (box.clientHeight || 500) + 40, rotation: '+=' + gsap.utils.random(120, 300), x: '+=' + gsap.utils.random(-60, 60), duration: gsap.utils.random(2.6, 4.2), delay: gsap.utils.random(0, 0.8), ease: 'sine.in', onComplete: () => el.remove() })
  }
}

export const finalView = {
  name: 'final',
  async mount (el) {
    el.innerHTML = template()
    const root = el
    gsap.from($$('.final-panel > *', root), { y: 16, autoAlpha: 0, stagger: 0.07, duration: 0.55, ease: 'power2.out', delay: 0.15 })
    sound.play('success')

    $('#avatarName', root).addEventListener('input', e => store.setProfile({ name: e.target.value.trim() }))
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act
      if (!act || !stage) return
      if (act === 'spin') {
        const on = stage.setAutoRotate(!stage.controls.autoRotate)
        e.target.closest('[data-act]').setAttribute('aria-pressed', on)
      }
      if (act === 'zoomIn') stage.zoom(0.8)
      if (act === 'zoomOut') stage.zoom(1.25)
    })

    stage = await getStage(store.state)
    const mount = $('#finalStage', root)
    if (stage && root.isConnected) {
      await stage.avatar.apply(store.state)
      stage.attach(mount, 'final')
      $('.stage-loading', mount)?.remove()
      confetti(root)
    } else if (mount) {
      mount.innerHTML = '<p class="stage-fallback">La vista 3D no está disponible en este navegador, pero tu creación sigue guardada.</p>'
    }
  },
  unmount () { stage && stage.detach() }
}

