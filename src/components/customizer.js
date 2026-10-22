import gsap from 'gsap'
import { CATEGORIES, randomAvatar } from '../data/avatarOptions.js'
import { icon } from '../utils/icons.js'
import { esc, cssUrl, $, $$ } from '../utils/format.js'
import { store } from '../utils/store.js'
import { sound } from '../utils/sound.js'
import { go } from '../utils/router.js'
import { getStage } from '../three/Stage.js'
import { SLOT_BY_KEY } from '../three/Avatar.js'
import { renderAvatar, renderPart } from '../three/Snapshot.js'
import { toast } from './toast.js'
import { openInstructions, closeInstructions } from './instructions.js'

/* ==========================================================================
   ESTUDIO DE PERSONALIZACIÓN
   Interfaz (esta vista)  ⇄  store (estado)  ⇄  Avatar 3D (three/Avatar.js)
   La interfaz nunca toca Three.js directamente: cambia el estado y el
   avatar reacciona a ese cambio.
   ========================================================================== */

let stage = null
let unsubscribe = null
let activeCat = CATEGORIES[0].id
let thumbGen = 0
let root = null
let keyHandler = null
let leafTimer = null

/* Hoja de "guardado": el avatar se guarda solo en el navegador con cada cambio;
   la hoja aparece unos segundos en la esquina inferior izquierda para indicarlo. */
function flashSaveLeaf () {
  const leaf = $('.save-leaf', root)
  if (!leaf) return
  leaf.classList.remove('is-on')
  void leaf.offsetWidth // reinicia la animación si ya estaba visible
  leaf.classList.add('is-on')
  clearTimeout(leafTimer)
  leafTimer = setTimeout(() => leaf.classList.remove('is-on'), 2500)
}

function template () {
  return `
  <section class="studio" aria-label="Estudio de personalización">
    <div class="studio-stage">
      <div class="stage-mount" id="studioStage"><div class="stage-loading" aria-hidden="true">${icon('leaf')}</div></div>

      <div class="studio-top">
        <a class="chip-btn" href="#/">${icon('arrowLeft')}<span>Inicio</span></a>
        <div class="toolbar" role="toolbar" aria-label="Historial">
          <button type="button" class="tool" data-act="undo" aria-label="Deshacer" title="Deshacer (Ctrl+Z)">${icon('undo')}</button>
          <button type="button" class="tool" data-act="redo" aria-label="Rehacer" title="Rehacer (Ctrl+Y)">${icon('redo')}</button>
          <span class="toolbar-sep" aria-hidden="true"></span>
          <button type="button" class="tool" data-act="random" aria-label="Sorpréndeme: avatar aleatorio" title="Sorpréndeme">${icon('dice')}</button>
          <button type="button" class="tool" data-act="reset" aria-label="Reiniciar avatar" title="Reiniciar avatar">${icon('reset')}</button>
        </div>
        <div class="studio-top-right">
          <button type="button" class="tool tool--round" data-act="sound" aria-pressed="${sound.enabled}" aria-label="Sonidos">${icon(sound.enabled ? 'sound' : 'soundOff')}</button>
          <button type="button" class="tool tool--round" data-act="help" aria-label="¿Cómo funciona?">${icon('help')}</button>
        </div>
      </div>

      <div class="camera-bar toolbar" role="toolbar" aria-label="Cámara">
        <button type="button" class="tool" data-act="front" aria-label="Vista frontal" title="Vista frontal">${icon('front')}<span class="tool-label">Frente</span></button>
        <button type="button" class="tool" data-act="spin" aria-pressed="false" aria-label="Vista 360°, girar automáticamente" title="Vista 360°">${icon('rotate')}<span class="tool-label">360°</span></button>
        <span class="toolbar-sep" aria-hidden="true"></span>
        <button type="button" class="tool" data-act="zoomOut" aria-label="Alejar">${icon('zoomOut')}</button>
        <button type="button" class="tool" data-act="zoomIn" aria-label="Acercar">${icon('zoomIn')}</button>
      </div>
      <p class="stage-hint">Arrastra para ver desde el ángulo que quieras</p>
      <span class="save-leaf" aria-hidden="true" title="Cambios guardados en este navegador"></span>
    </div>

    <aside class="studio-panel" aria-label="Opciones de personalización">
      <h1 class="panel-title">¿Cómo te ves?</h1>
      <div class="cat-tabs" role="tablist" aria-label="Categorías">${tabsHTML()}</div>
      <div class="cat-panel" id="catPanel" role="tabpanel" tabindex="0"></div>
      <div class="panel-actions">
        ${mainButton('done', 'Confirmar')}
      </div>
    </aside>
  </section>`
}

/* ---------- Pestañas de categoría ----------
   Las pestañas amarillas consecutivas comparten el contenedor de círculos unidos. */
function tabHTML (c) {
  const on = c.id === activeCat
  return `
    <button type="button" class="cat-tab cat-tab--${c.tab.theme}" role="tab" id="tab-${c.id}" data-cat="${c.id}"
      aria-selected="${on}" aria-controls="catPanel" tabindex="${on ? 0 : -1}" aria-label="${esc(c.label)}">
      <span class="cat-icon" style='--icon:${cssUrl(`images/ui/${c.tab.icon}`)}' aria-hidden="true"></span>
      <span class="cat-label" aria-hidden="true">${esc(c.label)}</span>
    </button>`
}

function tabsHTML () {
  const yellow = CATEGORIES.filter(c => c.tab.theme === 'yellow')
  const others = CATEGORIES.filter(c => c.tab.theme !== 'yellow')
  return `<div class="cat-cluster">${yellow.map(tabHTML).join('')}</div>${others.map(tabHTML).join('')}`
}

/** Botón principal rojo; al pasar el mouse muestra el marco interior y el chulo. */
function mainButton (act, label) {
  return `<button type="button" class="btn-main" data-act="${act}"><span>${label}</span><span class="btn-main-badge" aria-hidden="true"></span></button>`
}

/* ---------- Panel de opciones ---------- */
function groupHTML (g, i, groups) {
  const value = store.state[g.key]
  // Con un solo grupo el título ya lo da el cartel de la pestaña, y en los botones con
  // imagen el dibujo basta: el título queda solo para lectores de pantalla
  const legend = `<legend class="${groups.length === 1 || g.type === 'images' ? 'sr-only' : ''}">${esc(g.label)}</legend>`
  if (g.type === 'colors') {
    return `
      <fieldset class="opt-group">
        ${legend}
        <div class="swatches" role="radiogroup" aria-label="${esc(g.label)}">
          ${g.options.map(o => `
            <button type="button" class="swatch" role="radio" data-key="${g.key}" data-id="${o.id}"
              aria-checked="${o.id === value}" tabindex="${o.id === value ? 0 : -1}"
              aria-label="${esc(o.name)}" title="${esc(o.name)}" style="--c:${o.id}">
              <span class="swatch-shape"><span class="swatch-ring"></span><span class="swatch-blob"></span><span class="swatch-check">${icon('check')}</span></span>
            </button>`).join('')}
        </div>
      </fieldset>`
  }
  if (g.type === 'images') {
    // La imagen es el botón; su silueta (canal alfa) sirve de molde para el contorno rojo
    return `
      <fieldset class="opt-group opt-group--images">
        ${legend}
        <div class="img-opts" role="radiogroup" aria-label="${esc(g.label)}">
          ${g.options.map(o => `
            <button type="button" class="img-opt" role="radio" data-key="${g.key}" data-id="${o.id}"
              aria-checked="${o.id === value}" tabindex="${o.id === value ? 0 : -1}"
              aria-label="${esc(o.name)}" title="${esc(o.name)}" style='--img:${cssUrl(o.image)}'>
              <span class="img-opt-shape"><span class="img-opt-ring"></span><img class="img-opt-img" src="${o.image}" alt="" /><span class="img-opt-check">${icon('check')}</span></span>
            </button>`).join('')}
        </div>
      </fieldset>`
  }
  return `
    <fieldset class="opt-group">
      ${legend}
      <div class="opt-grid" role="radiogroup" aria-label="${esc(g.label)}">
        ${g.options.map(o => `
          <button type="button" class="opt" role="radio" data-key="${g.key}" data-id="${o.id}"
            aria-checked="${o.id === value}" tabindex="${o.id === value ? 0 : -1}">
            <span class="opt-thumb" data-thumb="${g.key}:${o.id}">
              ${o.thumbnail ? `<img src="${o.thumbnail}" alt="" />` : '<span class="thumb-skeleton"></span>'}
            </span>
            <span class="opt-name">${esc(o.name)}</span>
            <span class="opt-check" aria-hidden="true">${icon('check')}</span>
          </button>`).join('')}
      </div>
    </fieldset>`
}

function renderPanel (animate = true) {
  const cat = CATEGORIES.find(c => c.id === activeCat)
  const panel = $('#catPanel', root)
  panel.setAttribute('aria-labelledby', `tab-${cat.id}`)
  panel.innerHTML = cat.groups.map(groupHTML).join('')
  panel.scrollTop = 0
  if (animate) gsap.from($$('.opt-group', panel), { y: 12, autoAlpha: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out' })
  queueThumbs(cat)
}

/** Actualiza solo los estados seleccionados (sin redibujar el panel). */
function syncSelection () {
  $$('[role="radio"][data-key]', root).forEach(b => {
    const on = store.state[b.dataset.key] === b.dataset.id
    b.setAttribute('aria-checked', on)
    b.tabIndex = on ? 0 : -1
  })
  const undo = $('[data-act="undo"]', root)
  const redo = $('[data-act="redo"]', root)
  undo.disabled = !store.canUndo
  redo.disabled = !store.canRedo
}

/* ---------- Miniaturas automáticas (renderizadas con Three.js) ---------- */
function queueThumbs (cat) {
  const gen = ++thumbGen
  const jobs = []
  cat.groups.forEach(g => {
    if (g.type !== 'options') return
    g.options.forEach(o => { if (!o.thumbnail) jobs.push({ g, o }) })
  })
  const run = async () => {
    for (const { g, o } of jobs) {
      if (gen !== thumbGen || !root || !root.isConnected) return
      const slot = SLOT_BY_KEY[g.key]
      const cfg = { ...store.state, [g.key]: o.id }
      let url = null
      if (g.thumb === 'part') url = await renderPart(slot.slot, o, cfg, 160)
      else url = await renderAvatar(cfg, { width: 160, height: 160, framing: g.thumb === 'bust' ? 'bust' : 'full' })
      const box = $(`[data-thumb="${g.key}:${o.id}"]`, root)
      if (box && gen === thumbGen) {
        box.innerHTML = url ? `<img src="${url}" alt="" />` : `<span class="thumb-none">${icon('none')}</span>`
        gsap.fromTo(box.firstElementChild, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.3 })
      }
      await new Promise(r => requestAnimationFrame(r))
    }
  }
  run()
}

/* ---------- Acciones ---------- */
function selectCategory (id, focus = false) {
  if (id === activeCat) return
  activeCat = id
  $$('.cat-tab', root).forEach(t => {
    const on = t.dataset.cat === id
    t.setAttribute('aria-selected', on)
    t.tabIndex = on ? 0 : -1
    if (on && focus) t.focus()
  })
  renderPanel()
  sound.play('tab')
  const cat = CATEGORIES.find(c => c.id === id)
  if (stage) {
    stage.setAutoRotate(false)
    setSpin(false)
    stage.focus(cat.camera || 'full')
  }
}

function setSpin (on) {
  const b = $('[data-act="spin"]', root)
  if (b) b.setAttribute('aria-pressed', on)
}

function onAction (act) {
  switch (act) {
    case 'undo': if (store.undo()) sound.play('soft'); break
    case 'redo': if (store.redo()) sound.play('soft'); break
    case 'reset':
      if (store.reset()) { toast('Avatar reiniciado. Puedes deshacerlo.', { iconName: 'reset' }); sound.play('soft') }
      break
    case 'random':
      store.replace(randomAvatar(), 'random')
      sound.play('success')
      break
    case 'front':
      if (stage) { stage.setAutoRotate(false); setSpin(false); stage.focus('full') }
      break
    case 'spin':
      if (stage) setSpin(stage.setAutoRotate(!stage.controls.autoRotate))
      break
    case 'zoomIn': stage && stage.zoom(0.8); break
    case 'zoomOut': stage && stage.zoom(1.25); break
    case 'sound': {
      const on = sound.toggle()
      const b = $('[data-act="sound"]', root)
      b.setAttribute('aria-pressed', on)
      b.innerHTML = icon(on ? 'sound' : 'soundOff')
      break
    }
    case 'help': openInstructions(); break
    case 'done':
      sound.fx('confirm')
      store.save()
      go('/listo')
      break
  }
}

/* Navegación con flechas dentro de un grupo de opciones (patrón radiogroup) */
function onRadioKeys (e) {
  const btn = e.target.closest('[role="radio"]')
  if (!btn) return
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const items = $$('[role="radio"]', btn.parentElement)
  const i = items.indexOf(btn)
  const next = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]
  next.focus()
  next.click()
}

function onTabKeys (e) {
  const tab = e.target.closest('[role="tab"]')
  if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
  e.preventDefault()
  const tabs = $$('[role="tab"]', root)
  let i = tabs.indexOf(tab)
  if (e.key === 'ArrowRight') i = (i + 1) % tabs.length
  if (e.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length
  if (e.key === 'Home') i = 0
  if (e.key === 'End') i = tabs.length - 1
  selectCategory(tabs[i].dataset.cat, true)
}

/* Cuando cambia el estado, el avatar 3D reacciona */
async function onStoreChange (state, meta) {
  syncSelection()
  flashSaveLeaf()
  if (!stage) return
  const changed = await stage.avatar.apply(state)
  if (meta.type === 'set' && changed.length) {
    const slot = changed[0]
    const slotName = SLOT_BY_KEY[meta.key] ? SLOT_BY_KEY[meta.key].slot : slot
    stage.sparkleAt(slotName === 'body' ? 'shirt' : slotName)
  }
  if (meta.type === 'reset' || meta.type === 'random' || meta.type === 'undo' || meta.type === 'redo') {
    renderPanelThumbsOnly()
  }
}

function renderPanelThumbsOnly () {
  const cat = CATEGORIES.find(c => c.id === activeCat)
  queueThumbs(cat)
}

export const customizerView = {
  name: 'customize',
  async mount (el) {
    root = el
    el.innerHTML = template()
    renderPanel(false)
    syncSelection()

    el.addEventListener('click', e => {
      const radio = e.target.closest('[role="radio"][data-key]')
      if (radio) {
        const changed = store.set(radio.dataset.key, radio.dataset.id)
        if (changed) {
          sound.play('pop')
          // Las muestras de color y los botones con imagen tienen su propia animación de burbuja en CSS
          if (!radio.matches('.swatch, .img-opt')) gsap.fromTo(radio, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' })
        }
        return
      }
      const tab = e.target.closest('[data-cat]')
      if (tab) return selectCategory(tab.dataset.cat)
      const act = e.target.closest('[data-act]')
      if (act) onAction(act.dataset.act)
    })
    el.addEventListener('keydown', e => { onRadioKeys(e); onTabKeys(e) })

    keyHandler = e => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod || e.target.matches('input, textarea')) return
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); onAction('undo') }
      if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) { e.preventDefault(); onAction('redo') }
    }
    window.addEventListener('keydown', keyHandler)

    unsubscribe = store.subscribe(onStoreChange)

    if (!store.flag('introSeen')) {
      setTimeout(() => openInstructions(() => store.flag('introSeen', true)), 450)
    }

    stage = await getStage(store.state)
    const mount = $('#studioStage', el)
    if (stage && el.isConnected) {
      await stage.avatar.apply(store.state)
      stage.attach(mount, 'edit')
      $('.stage-loading', mount)?.remove()
      const cat = CATEGORIES.find(c => c.id === activeCat)
      stage.focus(cat.camera || 'full', 1.4)
    } else if (mount) {
      mount.innerHTML = '<p class="stage-fallback">No fue posible iniciar la vista 3D en este navegador. Prueba con una versión reciente de Chrome, Edge, Firefox o Safari.</p>'
    }
  },
  unmount () {
    thumbGen++
    closeInstructions()
    clearTimeout(leafTimer)
    unsubscribe && unsubscribe()
    window.removeEventListener('keydown', keyHandler)
    stage && stage.detach()
    root = null
  }
}
