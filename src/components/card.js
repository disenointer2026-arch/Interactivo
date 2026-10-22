import gsap from 'gsap'
import { CARD } from '../data/content.js'
import { icon } from '../utils/icons.js'
import { esc, $, $$, REDUCED_MOTION } from '../utils/format.js'
import { store } from '../utils/store.js'
import { sound } from '../utils/sound.js'
import { go } from '../utils/router.js'
import { renderAvatar } from '../three/Snapshot.js'
import { drawCard, cardSerial } from './cardRenderer.js'
import { lockup } from './layout.js'
import { createDialog, openDialog, closeDialog } from './dialog.js'
import { toast } from './toast.js'

/* ==========================================================================
   TARJETA COLECCIONABLE (tipo Amiibo, diseño propio)
   Se genera automáticamente con el avatar actual; el usuario puede ajustar
   nombre, cumpleaños y fondo. Luego comparte (simulado).
   ========================================================================== */

let root = null
let portrait = null
let dataURL = ''
let blob = null
let renderToken = 0
let shareDialog = null
let flipped = false
let cleanupTilt = null

/* Días por mes (febrero admite el 29) */
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Texto del cumpleaños ("12 de marzo") o '' si aún no se ha elegido. */
function birthdayText (p) {
  if (!p.birthDay || p.birthMonth === '') return ''
  return `${p.birthDay} de ${CARD.months[p.birthMonth]}`
}

function dayOptions (month, day) {
  const max = month === '' ? 31 : MONTH_DAYS[month]
  return `<option value="" ${day ? '' : 'selected'} disabled>Día</option>` +
    Array.from({ length: max }, (_, i) => i + 1).map(d => `<option value="${d}" ${d === day ? 'selected' : ''}>${d}</option>`).join('')
}

function birthdayField (p) {
  return `<fieldset class="field birthday">
    <legend class="field-label">Cumpleaños</legend>
    <div class="birthday-row">
      <select class="input" id="cardDay" aria-label="Día">${dayOptions(p.birthMonth, p.birthDay)}</select>
      <select class="input" id="cardMonth" aria-label="Mes">
        <option value="" ${p.birthMonth === '' ? 'selected' : ''} disabled>Mes</option>
        ${CARD.months.map((m, i) => `<option value="${i}" ${i === p.birthMonth ? 'selected' : ''}>${m.charAt(0).toUpperCase() + m.slice(1)}</option>`).join('')}
      </select>
    </div>
  </fieldset>`
}

function template () {
  const p = store.profile
  return `
  <section class="cardpage wrap" aria-labelledby="card-title">
    <div class="card-stage">
      <div class="card3d" id="card3d">
        <div class="card-face card-front">
          <img id="cardImg" alt="Tarjeta coleccionable de ${esc(p.name || 'tu avatar')}" />
          <span class="card-shine" aria-hidden="true"></span>
          <div class="card-generating" aria-hidden="true"><span class="spinner-leaf">${icon('leaf')}</span><span>Generando tu tarjeta…</span></div>
        </div>
        <div class="card-face card-back" aria-hidden="true">
          <div class="card-back-inner">
            ${lockup('lockup--stack')}
            <p>Esta tarjeta guarda una creación única.</p>
            <span class="card-back-serial">N.º ${cardSerial(store.state)}</span>
          </div>
        </div>
      </div>
      <button type="button" class="chip-btn card-flip" data-flip aria-pressed="false">${icon('rotate')}<span>Voltear tarjeta</span></button>
    </div>

    <div class="card-panel">
      <h1 id="card-title">Crea tu tarjeta Amiibo</h1>
      <p class="muted">Se generó a partir de tu avatar. Ajusta sus datos y el fondo: la tarjeta cambia al instante.</p>

      <label class="field"><span class="field-label">Nombre</span>
        <input class="input" id="cardName" maxlength="18" autocomplete="off" placeholder="Tu avatar" value="${esc(p.name)}" /></label>
      ${birthdayField(p)}
      <fieldset class="opt-group">
        <legend>Fondo</legend>
        <div class="theme-row" role="radiogroup" aria-label="Fondo">
          ${CARD.themes.map(t => `<button type="button" class="theme-opt" role="radio" data-theme="${t.id}" aria-checked="${t.id === p.theme}" tabindex="${t.id === p.theme ? 0 : -1}" style="--from:${t.from};--to:${t.to};--leaf:${t.leaf}"><span class="theme-swatch" aria-hidden="true"></span><span>${t.name}</span></button>`).join('')}
        </div>
      </fieldset>

      <div class="ready" id="ready" hidden>
        <h2 class="ready-title">¡Tu tarjeta está lista!</h2>
        <div class="final-actions">
          <button type="button" class="choice-card" data-share><strong>Compartir</strong><span>Descárgala o compártela</span><i class="choice-card-arrow" aria-hidden="true">${icon('arrowRight')}</i></button>
          <button type="button" class="choice-card" data-finish><strong>Finalizar</strong><span>Volver al inicio</span><i class="choice-card-arrow" aria-hidden="true">${icon('arrowRight')}</i></button>
        </div>
      </div>
      <a class="choice-card choice-card--row" href="#/listo"><strong>Volver a mi avatar</strong><i class="choice-card-arrow" aria-hidden="true">${icon('arrowLeft')}</i></a>
    </div>
  </section>`
}

async function regenerate (first = false) {
  const token = ++renderToken
  const p = store.profile
  const date = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  const birthday = birthdayText(p)
  const canvas = await drawCard({ portrait, name: p.name || 'Tu avatar', birthday, theme: p.theme, avatar: store.state, date })
  if (token !== renderToken || !root) return
  dataURL = canvas.toDataURL('image/png')
  canvas.toBlob(b => { blob = b }, 'image/png')
  const img = $('#cardImg', root)
  img.src = dataURL
  img.alt = `Tarjeta coleccionable de ${p.name || 'tu avatar'}${birthday ? `, cumpleaños el ${birthday}` : ''}`
  if (first) reveal()
}

function reveal () {
  const card = $('#card3d', root)
  const tl = gsap.timeline()
  tl.to($('.card-generating', root), { autoAlpha: 0, duration: 0.3 })
    .fromTo(card, { rotationY: -180, scale: 0.8, y: 30 }, { rotationY: 0, scale: 1, y: 0, duration: REDUCED_MOTION ? 0.01 : 1.2, ease: 'power3.out' }, 0)
    .fromTo($('.card-shine', root), { backgroundPosition: '-150% 0' }, { backgroundPosition: '250% 0', duration: 1.2, ease: 'power2.inOut' }, 0.7)
    .add(() => {
      const ready = $('#ready', root)
      ready.hidden = false
      gsap.from(ready, { y: 14, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' })
      sound.play('success')
    }, '-=0.3')
}

/* Inclinación suave de la tarjeta con el puntero */
function tilt () {
  const stageEl = $('.card-stage', root)
  const card = $('#card3d', root)
  if (REDUCED_MOTION || !window.matchMedia('(hover: hover)').matches) return () => {}
  const move = e => {
    const r = stageEl.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(card, { rotationY: (flipped ? 180 : 0) + x * 14, rotationX: -y * 12, duration: 0.6, ease: 'power2.out' })
    $('.card-shine', root).style.setProperty('--mx', `${(x + 0.5) * 100}%`)
  }
  const leave = () => gsap.to(card, { rotationY: flipped ? 180 : 0, rotationX: 0, duration: 0.8, ease: 'power3.out' })
  stageEl.addEventListener('pointermove', move)
  stageEl.addEventListener('pointerleave', leave)
  return () => { stageEl.removeEventListener('pointermove', move); stageEl.removeEventListener('pointerleave', leave) }
}

/* ---------- Compartir (simulado) ---------- */
function fileName () {
  const n = (store.profile.name || 'mi-avatar').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
  return `tarjeta-${n}-miniso-x-animal-crossing.png`
}

function openShare () {
  if (!shareDialog) {
    const socials = [
      { id: 'instagram', label: 'Instagram', short: 'IG' },
      { id: 'facebook', label: 'Facebook', short: 'f' },
      { id: 'x', label: 'X', short: 'X' },
      { id: 'whatsapp', label: 'WhatsApp', short: 'WA' }
    ]
    shareDialog = createDialog({
      className: 'modal--share',
      label: 'Compartir tarjeta',
      html: `
        <button type="button" class="icon-btn modal-close" data-close aria-label="Cerrar">${icon('close')}</button>
        <div class="share-grid">
          <img class="share-preview" alt="Vista previa de tu tarjeta" />
          <div>
            <p class="modal-kicker">Lista para compartir</p>
            <h2 class="modal-title">Comparte tu tarjeta</h2>
            <p class="muted">Descárgala como imagen o elige una red. Es una simulación: no se publicará nada.</p>
            <div class="share-actions">
              <a class="choice-card choice-card--row choice-card--primary" data-download download><strong>Descargar imagen</strong><i class="choice-card-arrow" aria-hidden="true">${icon('download')}</i></a>
              <button type="button" class="choice-card choice-card--row" data-native hidden><strong>Compartir desde el dispositivo</strong><i class="choice-card-arrow" aria-hidden="true">${icon('share')}</i></button>
            </div>
            <p class="share-label">Redes sociales (simulado)</p>
            <div class="social-row">
              ${socials.map(s => `<button type="button" class="social-btn social-btn--${s.id}" data-social="${s.label}"><span class="social-glyph" aria-hidden="true">${s.short}</span><span>${s.label}</span></button>`).join('')}
            </div>
            <button type="button" class="chip-btn" data-copy>${icon('link')}<span>Copiar enlace</span></button>
          </div>
        </div>`
    })
    shareDialog.addEventListener('click', async e => {
      if (e.target.closest('[data-close]')) return closeDialog(shareDialog)
      if (e.target.closest('[data-download]')) { toast('Imagen descargada', { iconName: 'download' }); return }
      const s = e.target.closest('[data-social]')
      if (s) {
        const b = s
        b.classList.add('is-sent')
        gsap.fromTo(b, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
        sound.play('pop')
        toast(`Simulación: tu tarjeta quedó lista para ${b.dataset.social}. No se publicó nada.`, { iconName: 'share', duration: 3200 })
        return
      }
      if (e.target.closest('[data-copy]')) {
        const link = `https://miniso.com.co/animal-crossing/tarjeta/${cardSerial(store.state)}`
        try { await navigator.clipboard.writeText(link); toast('Enlace ficticio copiado') } catch { toast(link, { iconName: 'link', duration: 4000 }) }
        return
      }
      if (e.target.closest('[data-native]') && blob) {
        const file = new File([blob], fileName(), { type: 'image/png' })
        try { await navigator.share({ files: [file], title: 'Mi tarjeta MINISO × Animal Crossing' }) } catch { /* cancelado */ }
      }
    })
  }
  const d = shareDialog
  $('.share-preview', d).src = dataURL
  const a = $('[data-download]', d)
  a.href = dataURL
  a.download = fileName()
  const native = $('[data-native]', d)
  native.hidden = !(blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'x.png', { type: 'image/png' })] }))
  $$('.social-btn', d).forEach(b => b.classList.remove('is-sent'))
  openDialog(d)
}

/* ---------- Eventos ---------- */
let debounce = null
function onInput (e) {
  if (e.target.id === 'cardName') {
    store.setProfile({ name: e.target.value.trim() })
    clearTimeout(debounce)
    debounce = setTimeout(() => regenerate(), 180)
  }
}
function onChange (e) {
  if (e.target.id === 'cardDay') {
    store.setProfile({ birthDay: Number(e.target.value) })
    regenerate()
  }
  if (e.target.id === 'cardMonth') {
    const month = Number(e.target.value)
    // Si el día elegido no existe en el nuevo mes (p. ej. 31 de abril), se ajusta al último día
    const day = store.profile.birthDay ? Math.min(store.profile.birthDay, MONTH_DAYS[month]) : ''
    store.setProfile({ birthMonth: month, birthDay: day })
    $('#cardDay', root).innerHTML = dayOptions(month, day)
    regenerate()
  }
}
function onClick (e) {
  const th = e.target.closest('[data-theme]')
  if (th) {
    store.setProfile({ theme: th.dataset.theme })
    $$('[data-theme]', root).forEach(b => { const on = b === th; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1 })
    sound.play('pop')
    return regenerate()
  }
  const flip = e.target.closest('[data-flip]')
  if (flip) {
    flipped = !flipped
    flip.setAttribute('aria-pressed', flipped)
    gsap.to($('#card3d', root), { rotationY: flipped ? 180 : 0, rotationX: 0, duration: 0.9, ease: 'power3.inOut' })
    sound.play('soft')
    return
  }
  if (e.target.closest('[data-share]')) return openShare()
  if (e.target.closest('[data-finish]')) { go('/'); toast('¡Gracias por crear con nosotros!', { iconName: 'leaf' }) }
}
function onKeys (e) {
  const r = e.target.closest('[role="radio"]')
  if (!r || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const items = $$('[role="radio"]', r.parentElement)
  const i = items.indexOf(r) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1)
  const n = items[(i + items.length) % items.length]
  n.focus(); n.click()
}

export const cardView = {
  name: 'card',
  async mount (el) {
    root = el
    flipped = false
    el.innerHTML = template()
    gsap.from($$('.card-panel > *', el), { y: 14, autoAlpha: 0, stagger: 0.06, duration: 0.5, delay: 0.1 })
    el.addEventListener('input', onInput)
    el.addEventListener('change', onChange)
    el.addEventListener('click', onClick)
    el.addEventListener('keydown', onKeys)
    cleanupTilt = tilt()
    portrait = await renderAvatar(store.state, { width: 620, height: 620, framing: 'portrait', angle: 0.3 })
    if (root) await regenerate(true)
  },
  unmount () {
    renderToken++
    cleanupTilt && cleanupTilt()
    root = null
  }
}
