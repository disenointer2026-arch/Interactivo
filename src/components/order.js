import gsap from 'gsap'
import { PRODUCTS, SHIPPING, STORES, BANKS } from '../data/content.js'
import { icon } from '../utils/icons.js'
import { esc, cop, hashString, $, $$ } from '../utils/format.js'
import { store } from '../utils/store.js'
import { sound } from '../utils/sound.js'
import { go } from '../utils/router.js'
import { renderAvatar } from '../three/Snapshot.js'
import { productVisual } from './productVisual.js'
import { createDialog, openDialog, closeDialog } from './dialog.js'
import { toast } from './toast.js'

/* ==========================================================================
   PEDIDO (checkout SIMULADO)
   Paso 1 Producto → (inicio de sesión opcional) → Paso 2 Tus datos → Paso 3 Pago
   Nada se envía a ningún servidor: todo vive en memoria y en localStorage.
   ========================================================================== */

const STEPS = ['Producto', 'Tus datos', 'Pago']
let root = null
let portrait = ''
let loginDialog = null

const draft = {
  step: 0,
  productId: 'figure',
  qty: 1,
  customer: { name: '', lastName: '', email: '', phone: '', city: 'Cali', address: '' },
  payment: 'card'
}

const product = () => PRODUCTS.find(p => p.id === draft.productId)
const totals = () => {
  const subtotal = product().price * draft.qty
  const shipping = subtotal >= SHIPPING.freeFrom ? 0 : SHIPPING.cost
  return { subtotal, shipping, total: subtotal + shipping }
}

/* ---------- Plantillas ---------- */
function stepper () {
  return `<ol class="stepper" aria-label="Pasos del pedido">
    ${STEPS.map((s, i) => `<li class="${i < draft.step ? 'is-done' : ''} ${i === draft.step ? 'is-current' : ''}" ${i === draft.step ? 'aria-current="step"' : ''}>
      <span class="stepper-num" aria-hidden="true">${i < draft.step ? icon('check') : i + 1}</span><span>${s}</span></li>`).join('')}
  </ol>`
}

function stepProduct () {
  return `
    <h2 class="step-title">Tu producto</h2>
    <div class="product-options" role="radiogroup" aria-label="Producto">
      ${PRODUCTS.map(p => `
        <button type="button" class="product-opt" role="radio" data-product="${p.id}" aria-checked="${p.id === draft.productId}" tabindex="${p.id === draft.productId ? 0 : -1}">
          <span class="product-opt-visual">${productVisual(p.id, portrait)}</span>
          <span class="product-opt-copy"><strong>${esc(p.name)}</strong><span>${esc(p.detail)}</span></span>
          <span class="product-opt-price">${cop(p.price)}</span>
          <span class="opt-check" aria-hidden="true">${icon('check')}</span>
        </button>`).join('')}
    </div>
    <div class="avail">
      <span class="avail-dot" aria-hidden="true"></span>
      <p><strong>Disponible.</strong> Se fabrica bajo pedido a partir de tu avatar. Tiempo estimado: <span id="eta">${esc(product().days)}</span>.</p>
    </div>
    <div class="qty-row">
      <span class="field-label" id="qtyLabel">Cantidad</span>
      <div class="qty" role="group" aria-labelledby="qtyLabel">
        <button type="button" class="icon-btn" data-qty="-1" aria-label="Quitar una unidad">${icon('minus')}</button>
        <output id="qtyOut" aria-live="polite">${draft.qty}</output>
        <button type="button" class="icon-btn" data-qty="1" aria-label="Agregar una unidad">${icon('plus')}</button>
      </div>
    </div>
    <div class="step-actions">
      <a class="btn btn--quiet" href="#/listo">${icon('arrowLeft')}<span>Volver</span></a>
      <button type="button" class="btn btn--primary" data-next>Continuar</button>
    </div>`
}

function field (id, label, { type = 'text', autocomplete = '', required = true, value = '', inputmode = '', placeholder = '' } = {}) {
  return `<label class="field" for="${id}">
    <span class="field-label">${label}${required ? '' : ' <em>(opcional)</em>'}</span>
    <input class="input" id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''} ${placeholder ? `placeholder="${placeholder}"` : ''} ${required ? 'required aria-required="true"' : ''} aria-describedby="${id}-err" />
    <span class="field-error" id="${id}-err"></span>
  </label>`
}

function stepData () {
  const c = draft.customer
  const session = store.session
  return `
    <h2 class="step-title">Tus datos</h2>
    ${session ? `<p class="session-note">${icon('user')}<span>Sesión simulada iniciada como <strong>${esc(session.email)}</strong></span></p>` : ''}
    <form class="form-grid" id="dataForm" novalidate>
      ${field('name', 'Nombre', { autocomplete: 'given-name', value: c.name })}
      ${field('lastName', 'Apellido', { autocomplete: 'family-name', value: c.lastName })}
      ${field('email', 'Correo', { type: 'email', autocomplete: 'email', value: c.email, placeholder: 'nombre@correo.com' })}
      ${field('phone', 'Teléfono', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', value: c.phone, placeholder: '300 000 0000' })}

      <fieldset class="field field--full delivery-choice">
        <legend class="field-label">¿Cómo quieres recibirlo?</legend>
        <div class="seg" role="radiogroup" aria-label="Método de entrega">
          <button type="button" class="seg-opt" role="radio" aria-checked="true">${icon('truck')}<span><strong>Entrega a domicilio</strong><small>${cop(SHIPPING.cost)} (gratis desde ${cop(SHIPPING.freeFrom)})</small></span></button>
        </div>
      </fieldset>

      <label class="field" for="city">
        <span class="field-label">Ciudad</span>
        <select class="input" id="city" name="city" autocomplete="address-level2">
          ${Object.keys(STORES).map(ci => `<option ${ci === c.city ? 'selected' : ''}>${ci}</option>`).join('')}
          <option ${c.city === 'Otra' ? 'selected' : ''} value="Otra">Otra ciudad</option>
        </select>
      </label>

      <div class="field-slot">
        ${field('address', 'Dirección', { autocomplete: 'street-address', value: c.address, placeholder: 'Calle, número, barrio' })}
      </div>
    </form>
    <div class="step-actions">
      <button type="button" class="btn btn--quiet" data-prev>${icon('arrowLeft')}<span>Atrás</span></button>
      <button type="button" class="btn btn--primary" data-next>Continuar al pago</button>
    </div>`
}

function stepPay () {
  const methods = [
    { id: 'card', label: 'Tarjeta', sub: 'Crédito o débito' },
    { id: 'pse', label: 'PSE', sub: 'Débito desde tu banco' },
    { id: 'nequi', label: 'Nequi', sub: 'Pago con tu celular' }
  ]
  return `
    <h2 class="step-title">Método de pago</h2>
    <p class="sim-note">${icon('lock')}<span>Esto es una simulación: no se realiza ningún cobro y no debes ingresar datos reales.</span></p>
    <div class="pay-methods" role="radiogroup" aria-label="Método de pago">
      ${methods.map(m => `<button type="button" class="pay-opt" role="radio" data-pay="${m.id}" aria-checked="${m.id === draft.payment}"><strong>${m.label}</strong><small>${m.sub}</small><span class="opt-check" aria-hidden="true">${icon('check')}</span></button>`).join('')}
    </div>
    <form class="form-grid pay-form" id="payForm" novalidate>${payFields()}</form>
    <div class="step-actions">
      <button type="button" class="btn btn--quiet" data-prev>${icon('arrowLeft')}<span>Atrás</span></button>
      <button type="button" class="btn btn--primary btn--lg" data-finish>${icon('lock')}<span>Finalizar pago · <span data-total>${cop(totals().total)}</span></span></button>
    </div>`
}

function payFields () {
  switch (draft.payment) {
    case 'card': return `
      <div class="card-preview field--full" aria-hidden="true"><span class="cp-chip"></span><span class="cp-num" id="cpNum">•••• •••• •••• ••••</span><span class="cp-name" id="cpName">NOMBRE EN LA TARJETA</span></div>
      ${field('ccNumber', 'Número de tarjeta', { inputmode: 'numeric', placeholder: '4242 4242 4242 4242', autocomplete: 'off' }).replace('class="field"', 'class="field field--full"')}
      ${field('ccName', 'Nombre en la tarjeta', { autocomplete: 'off', value: [draft.customer.name, draft.customer.lastName].join(' ').trim() }).replace('class="field"', 'class="field field--full"')}
      ${field('ccExp', 'Vence (MM/AA)', { inputmode: 'numeric', placeholder: '08/29', autocomplete: 'off' })}
      ${field('ccCvc', 'CVC', { inputmode: 'numeric', placeholder: '123', autocomplete: 'off' })}`
    case 'pse': return `
      <label class="field field--full" for="bank"><span class="field-label">Banco</span>
        <select class="input" id="bank">${BANKS.map(b => `<option>${b}</option>`).join('')}</select></label>
      <p class="field--full muted">Al finalizar, simularemos la redirección a tu banco.</p>`
    case 'nequi': return `${field('nequiPhone', 'Celular Nequi', { type: 'tel', inputmode: 'tel', value: draft.customer.phone, placeholder: '300 000 0000' }).replace('class="field"', 'class="field field--full"')}
      <p class="field--full muted">Simularemos una notificación de pago en tu celular.</p>`
  }
}

function summaryAside () {
  const p = product()
  const t = totals()
  return `
    <div class="order-summary-card">
      <div class="os-visual">${productVisual(p.id, portrait)}</div>
      <h2 class="os-title">${esc(p.name)} de <span data-avname>${esc(store.profile.name || 'tu avatar')}</span></h2>
      <p class="os-avail"><span class="avail-dot" aria-hidden="true"></span>Disponible · ${esc(p.days)}</p>
      <dl class="os-lines">
        <div><dt>${esc(p.name)} × ${draft.qty}</dt><dd>${cop(t.subtotal)}</dd></div>
        <div><dt>Envío</dt><dd>${t.shipping ? cop(t.shipping) : 'Gratis'}</dd></div>
        <div class="os-total"><dt>Total</dt><dd>${cop(t.total)}</dd></div>
      </dl>
      <a class="os-edit" href="#/personalizar">${icon('edit')}<span>Editar avatar</span></a>
    </div>`
}

function template () {
  return `
  <section class="order wrap" aria-labelledby="order-title">
    <header class="order-head">
      <p class="eyebrow">${icon('bag')} Materializa tu creación</p>
      <h1 id="order-title">Pide tu producto</h1>
      <div id="stepper">${stepper()}</div>
    </header>
    <div class="order-grid">
      <div class="order-main"><div class="step-body" id="stepBody"></div></div>
      <aside class="order-aside" id="orderAside" aria-label="Resumen del pedido">${summaryAside()}</aside>
    </div>
  </section>`
}

/* ---------- Render ---------- */
function renderStep (dir = 1) {
  const body = $('#stepBody', root)
  body.innerHTML = [stepProduct, stepData, stepPay][draft.step]()
  $('#stepper', root).innerHTML = stepper()
  refreshAside()
  gsap.fromTo(body, { x: 24 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: 'power2.out' })
  const h = $('.step-title', body)
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }) }
  if (draft.step === 2 && draft.payment === 'card') bindCardPreview()
}

function refreshAside () {
  const aside = $('#orderAside', root)
  if (aside) aside.innerHTML = summaryAside()
  const tot = $('[data-total]', root)
  if (tot) tot.textContent = cop(totals().total)
}

/* ---------- Validación ---------- */
const RULES = {
  name: v => v.length >= 2 || 'Escribe tu nombre.',
  lastName: v => v.length >= 2 || 'Escribe tu apellido.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Revisa el formato del correo (nombre@correo.com).',
  phone: v => v.replace(/\D/g, '').length >= 7 || 'El teléfono debe tener al menos 7 dígitos.',
  address: v => v.length >= 5 || 'Escribe una dirección de entrega.',
  ccNumber: v => v.replace(/\D/g, '').length >= 15 || 'El número debe tener 15 o 16 dígitos.',
  ccName: v => v.length >= 3 || 'Escribe el nombre como aparece en la tarjeta.',
  ccExp: v => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) || 'Usa el formato MM/AA.',
  ccCvc: v => /^\d{3,4}$/.test(v) || 'El CVC tiene 3 o 4 dígitos.',
  nequiPhone: v => v.replace(/\D/g, '').length === 10 || 'El celular debe tener 10 dígitos.'
}

function validate (ids) {
  let first = null
  ids.forEach(id => {
    const input = $('#' + id, root)
    if (!input || input.closest('[hidden]')) return
    const res = RULES[id](input.value.trim())
    const err = $('#' + id + '-err', root)
    const ok = res === true
    input.setAttribute('aria-invalid', !ok)
    if (err) err.textContent = ok ? '' : res
    if (!ok && !first) first = input
  })
  if (first) {
    first.focus()
    gsap.fromTo(first, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
    sound.play('soft')
  }
  return !first
}

function readData () {
  const c = draft.customer
  ;['name', 'lastName', 'email', 'phone', 'address'].forEach(id => { const i = $('#' + id, root); if (i) c[id] = i.value.trim() })
  c.city = $('#city', root).value
}

/* ---------- Inicio de sesión simulado ---------- */
function askLogin (onDone) {
  if (store.session) return onDone()
  if (!loginDialog) {
    loginDialog = createDialog({
      className: 'modal--login',
      label: 'Inicio de sesión',
      html: `
        <button type="button" class="icon-btn modal-close" data-close aria-label="Cerrar">${icon('close')}</button>
        <div class="login-choice">
          <p class="modal-kicker">Antes de continuar</p>
          <h2 class="modal-title">¿Tienes cuenta MINISO?</h2>
          <p class="muted">Inicia sesión para autocompletar tus datos o continúa como invitado. Ambos caminos funcionan igual.</p>
          <div class="login-actions">
            <button type="button" class="btn btn--primary btn--block" data-login>${icon('user')}<span>Iniciar sesión con MINISO</span></button>
            <button type="button" class="btn btn--secondary btn--block" data-guest>Continuar sin iniciar sesión</button>
          </div>
        </div>
        <form class="login-form" hidden novalidate>
          <p class="modal-kicker">Cuenta MINISO (simulada)</p>
          <h2 class="modal-title">Iniciar sesión</h2>
          <label class="field" for="lgEmail"><span class="field-label">Correo</span>
            <input class="input" id="lgEmail" type="email" autocomplete="off" placeholder="nombre@correo.com" aria-describedby="lgEmail-err" /><span class="field-error" id="lgEmail-err"></span></label>
          <label class="field" for="lgPass"><span class="field-label">Contraseña</span>
            <input class="input" id="lgPass" type="password" autocomplete="off" aria-describedby="lgPass-err" /><span class="field-error" id="lgPass-err"></span></label>
          <p class="sim-note">${icon('lock')}<span>Formulario ficticio: no se conecta con ninguna cuenta real.</span></p>
          <div class="login-actions">
            <button type="submit" class="btn btn--primary btn--block">Entrar</button>
            <button type="button" class="btn btn--quiet btn--block" data-back>Volver</button>
          </div>
        </form>`
    })
  }
  const d = loginDialog
  const choice = $('.login-choice', d)
  const form = $('.login-form', d)
  choice.hidden = false
  form.hidden = true
  d.onclick = e => {
    if (e.target.closest('[data-close]')) closeDialog(d)
    if (e.target.closest('[data-guest]')) closeDialog(d, onDone)
    if (e.target.closest('[data-login]')) {
      choice.hidden = true; form.hidden = false
      gsap.from(form, { x: 20, autoAlpha: 0, duration: 0.3 })
      $('#lgEmail', d).focus()
    }
    if (e.target.closest('[data-back]')) { form.hidden = true; choice.hidden = false; $('[data-login]', d).focus() }
  }
  form.onsubmit = e => {
    e.preventDefault()
    const email = $('#lgEmail', d).value.trim()
    const pass = $('#lgPass', d).value
    const eOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    const pOk = pass.length >= 4
    $('#lgEmail-err', d).textContent = eOk ? '' : 'Escribe un correo válido.'
    $('#lgPass-err', d).textContent = pOk ? '' : 'Mínimo 4 caracteres (cualquier texto sirve).'
    $('#lgEmail', d).setAttribute('aria-invalid', !eOk)
    $('#lgPass', d).setAttribute('aria-invalid', !pOk)
    if (!eOk) return $('#lgEmail', d).focus()
    if (!pOk) return $('#lgPass', d).focus()
    const local = email.split('@')[0].replace(/[._\d-]+/g, ' ').trim()
    store.session = { email }
    if (!draft.customer.email) draft.customer.email = email
    if (!draft.customer.name && local) draft.customer.name = local.charAt(0).toUpperCase() + local.slice(1).split(' ')[0]
    toast('Sesión iniciada (simulación)', { iconName: 'user' })
    closeDialog(d, onDone)
  }
  openDialog(d)
}

/* ---------- Pago simulado ---------- */
function finish () {
  const ids = { card: ['ccNumber', 'ccName', 'ccExp', 'ccCvc'], nequi: ['nequiPhone'] }[draft.payment] || []
  if (!validate(ids)) return
  const labels = { card: 'Tarjeta', pse: 'PSE · ' + ($('#bank', root)?.value || ''), nequi: 'Nequi' }
  let payLabel = labels[draft.payment]
  if (draft.payment === 'card') payLabel += ' terminada en ' + $('#ccNumber', root).value.replace(/\D/g, '').slice(-4)

  const overlay = document.createElement('div')
  overlay.className = 'pay-loading'
  overlay.setAttribute('role', 'status')
  overlay.innerHTML = `<div class="pay-loading-card"><span class="spinner-leaf">${icon('leaf')}</span><p>${draft.payment === 'pse' ? 'Conectando con tu banco…' : 'Procesando tu pago…'}</p><small>Simulación, sin cargos reales</small></div>`
  document.body.appendChild(overlay)
  gsap.from(overlay, { autoAlpha: 0, duration: 0.25 })
  gsap.to($('.spinner-leaf', overlay), { rotation: 360, repeat: -1, duration: 1.4, ease: 'none' })

  const now = Date.now()
  const number = 'MXAC-' + hashString(now + draft.customer.email).toString(36).toUpperCase().slice(0, 6).padStart(6, '0')
  const p = product()
  const t = totals()
  const c = draft.customer
  store.setOrder({
    number,
    createdAt: now,
    product: { id: p.id, name: p.name, price: p.price, days: p.days },
    qty: draft.qty,
    ...t,
    delivery: 'delivery',
    deliveryLabel: `Entrega en ${c.address}, ${c.city === 'Otra' ? 'tu ciudad' : c.city}`,
    customer: { name: c.name, lastName: c.lastName, email: c.email, phone: c.phone },
    payment: payLabel,
    avatar: store.state,
    avatarName: store.profile.name || 'Tu avatar'
  })

  setTimeout(() => {
    gsap.to(overlay, { autoAlpha: 0, duration: 0.25, onComplete: () => overlay.remove() })
    go('/confirmacion')
  }, 1700)
}

function bindCardPreview () {
  const num = $('#ccNumber', root)
  const exp = $('#ccExp', root)
  const name = $('#ccName', root)
  const cvc = $('#ccCvc', root)
  num.addEventListener('input', () => {
    const d = num.value.replace(/\D/g, '').slice(0, 16)
    num.value = d.replace(/(.{4})/g, '$1 ').trim()
    $('#cpNum', root).textContent = (d + '•'.repeat(16 - d.length)).replace(/(.{4})/g, '$1 ').trim()
  })
  exp.addEventListener('input', () => {
    const d = exp.value.replace(/\D/g, '').slice(0, 4)
    exp.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d
  })
  cvc.addEventListener('input', () => { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4) })
  const upd = () => { $('#cpName', root).textContent = (name.value || 'Nombre en la tarjeta').toUpperCase() }
  name.addEventListener('input', upd)
  upd()
}

/* ---------- Eventos ---------- */
function onClick (e) {
  const t = e.target
  const prod = t.closest('[data-product]')
  if (prod) {
    draft.productId = prod.dataset.product
    $$('[data-product]', root).forEach(b => { const on = b === prod; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1 })
    $('#eta', root).textContent = product().days
    refreshAside()
    gsap.fromTo($('.os-visual', root), { scale: 0.92 }, { scale: 1, duration: 0.5, ease: 'back.out(2)' })
    sound.play('pop')
    return
  }
  const q = t.closest('[data-qty]')
  if (q) {
    draft.qty = Math.min(5, Math.max(1, draft.qty + Number(q.dataset.qty)))
    $('#qtyOut', root).textContent = draft.qty
    refreshAside()
    return
  }
  const pay = t.closest('[data-pay]')
  if (pay) {
    draft.payment = pay.dataset.pay
    $$('[data-pay]', root).forEach(b => b.setAttribute('aria-checked', b === pay))
    const form = $('#payForm', root)
    form.innerHTML = payFields()
    gsap.from(form, { y: 8, autoAlpha: 0, duration: 0.3 })
    if (draft.payment === 'card') bindCardPreview()
    sound.play('tab')
    return
  }
  if (t.closest('[data-prev]')) {
    if (draft.step === 1) readData()
    draft.step = Math.max(0, draft.step - 1)
    return renderStep(-1)
  }
  if (t.closest('[data-next]')) {
    if (draft.step === 0) {
      return askLogin(() => { draft.step = 1; renderStep() })
    }
    if (draft.step === 1) {
      if (!validate(['name', 'lastName', 'email', 'phone', 'address'])) return
      readData()
      draft.step = 2
      return renderStep()
    }
  }
  if (t.closest('[data-finish]')) finish()
}

/* Flechas en los grupos de radio (producto, entrega, pago) */
function onKeys (e) {
  const r = e.target.closest('[role="radio"]')
  if (!r || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const items = $$('[role="radio"]', r.parentElement)
  const i = items.indexOf(r) + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1)
  const n = items[(i + items.length) % items.length]
  n.focus(); n.click()
}

export const orderView = {
  name: 'order',
  async mount (el) {
    root = el
    draft.step = 0
    portrait = ''
    el.innerHTML = template()
    renderStep()
    el.addEventListener('click', onClick)
    el.addEventListener('keydown', onKeys)
    portrait = (await renderAvatar(store.state, { width: 360, height: 360, framing: 'portrait' })) || ''
    if (root && portrait) $$('.pv-img', root).forEach(img => { img.src = portrait })
  },
  unmount () { root = null }
}
