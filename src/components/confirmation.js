import gsap from 'gsap'
import { icon } from '../utils/icons.js'
import { esc, cop, $, $$ } from '../utils/format.js'
import { store } from '../utils/store.js'
import { sound } from '../utils/sound.js'
import { go } from '../utils/router.js'
import { renderAvatar, renderProduct } from '../three/Snapshot.js'
import { toast } from './toast.js'

/* CONFIRMACIÓN DEL PEDIDO (simulado) */

function empty () {
  return `<section class="confirm wrap confirm--empty">
    <h1>Aún no tienes pedidos</h1>
    <p class="muted">Crea tu avatar y pide tu producto para ver aquí la confirmación.</p>
    <a class="choice-card choice-card--row choice-card--primary confirm-cta" href="#/personalizar"><strong>¡Hacer mi avatar!</strong><i class="choice-card-arrow" aria-hidden="true">${icon('arrowRight')}</i></a>
  </section>`
}

function template (o) {
  const date = new Date(o.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  return `
  <section class="confirm wrap" aria-labelledby="confirm-title">
    <div class="confirm-hero">
      <span class="confirm-badge" aria-hidden="true">${icon('check')}</span>
      <h1 id="confirm-title">¡Tu pedido está listo!</h1>
      <p class="muted">Te enviamos (de mentira) la confirmación a <strong>${esc(o.customer.email)}</strong>.</p>
      <p class="order-number">Pedido <strong>${esc(o.number)}</strong></p>
    </div>

    <div class="confirm-grid">
      <div class="confirm-visual">
        <div class="confirm-render"><img class="confirm-render-img" alt="Render de la figura con su cadena, charm y base de acrílico" /></div>
        <p class="confirm-caption">${esc(o.product.name)} de <strong>${esc(o.avatarName)}</strong></p>
      </div>
      <div class="confirm-details">
        <h2 class="sr-only">Resumen del pedido</h2>
        <dl class="os-lines os-lines--big">
          <div><dt>Producto</dt><dd>${esc(o.product.name)} × ${o.qty}</dd></div>
          <div><dt>Avatar</dt><dd class="dd-avatar"><img class="confirm-mini" alt="" />${esc(o.avatarName)}</dd></div>
          <div><dt>${o.delivery === 'pickup' ? 'Recogida' : 'Entrega'}</dt><dd>${esc(o.deliveryLabel)}</dd></div>
          <div><dt>Tiempo estimado</dt><dd>${esc(o.product.days)}</dd></div>
          <div><dt>Pago</dt><dd>${esc(o.payment)}</dd></div>
          <div><dt>Fecha</dt><dd>${esc(date)}</dd></div>
          <div class="os-total"><dt>Total</dt><dd>${cop(o.total)}</dd></div>
        </dl>
        <div class="final-actions">
          <a class="choice-card" href="#/tarjeta"><strong>Crear tarjeta Amiibo</strong><span>Tu coleccionable digital</span><i class="choice-card-arrow" aria-hidden="true">${icon('arrowRight')}</i></a>
          <button type="button" class="choice-card" data-finish><strong>Finalizar</strong><span>Volver al inicio</span><i class="choice-card-arrow" aria-hidden="true">${icon('arrowRight')}</i></button>
        </div>
      </div>
    </div>
  </section>`
}

/** Render del producto con la proporción actual del cuadro (lo llena sin franjas); se
    vuelve a generar si la ventana cambia de tamaño y el cuadro cambia de forma. */
let current = null
async function refreshRender () {
  if (!current) return
  const { el, order } = current
  const box = $('.confirm-render', el)
  if (!box) return
  const { width, height } = box.getBoundingClientRect()
  if (!width || !height) return
  const k = Math.min(2, 720 / Math.max(width, height))
  const size = { width: Math.round(width * k), height: Math.round(height * k) }
  const key = `${Math.round(size.width / 24)}x${Math.round(size.height / 24)}`
  if (key === current.key) return
  current.key = key
  const url = await renderProduct(order.avatar, size)
  if (!current || current.el !== el || key !== current.key || !url) return
  $('.confirm-render-img', el).src = url
}
let resizeTimer = null
const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(refreshRender, 250) }

export const confirmationView = {
  name: 'confirm',
  async mount (el) {
    const o = store.order
    if (!o) { el.innerHTML = empty(); return }
    el.innerHTML = template(o)
    current = { el, order: o, key: '' }
    window.addEventListener('resize', onResize)
    sound.play('success')
    const tl = gsap.timeline({ delay: 0.1 })
    tl.from($('.confirm-badge', el), { scale: 0, rotation: -40, duration: 0.7, ease: 'back.out(2)' })
      .from($$('.confirm-hero > :not(.confirm-badge)', el), { y: 12, autoAlpha: 0, stagger: 0.08, duration: 0.45 }, '-=0.3')
      .from($$('.confirm-visual, .confirm-details', el), { y: 20, autoAlpha: 0, stagger: 0.12, duration: 0.55 }, '-=0.2')
    $('[data-finish]', el).addEventListener('click', () => { go('/'); toast('¡Gracias por crear con nosotros!', { iconName: 'leaf' }) })
    const url = await renderAvatar(o.avatar, { width: 360, height: 360, framing: 'portrait' })
    if (url) $$('.confirm-mini', el).forEach(img => { img.src = url })
    await refreshRender()
  },
  unmount () {
    current = null
    clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
  }
}
