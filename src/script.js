import './style.css'
import gsap from 'gsap'
import { SITE } from './data/content.js'
import { route, startRouter } from './utils/router.js'
import { REDUCED_MOTION } from './utils/format.js'
import { sound } from './utils/sound.js'
import { renderHeader, renderFooter, renderBackToTop } from './components/layout.js'
import { homeView } from './components/home.js'
import { customizerView } from './components/customizer.js'
import { finalView } from './components/final.js'
import { orderView } from './components/order.js'
import { confirmationView } from './components/confirmation.js'
import { cardView } from './components/card.js'
import { infoView } from './components/info.js'

/* ==========================================================================
   PUNTO DE ENTRADA
   Rutas (sitemap):
   #/               Inicio (banner, colaboración, cómo funciona, testimonios)
   #/personalizar   Estudio 3D (+ modal de instrucciones)
   #/listo          Vista final "¡Tu avatar está listo!"
   #/pedido         Pedido: producto → datos → pago (simulado)
   #/confirmacion   "¡Tu pedido está listo!"
   #/tarjeta        Tarjeta coleccionable + compartir
   #/info/:id       Páginas del menú (Marca, Productos, Tiendas…)
   ========================================================================== */

document.title = SITE.title
if (REDUCED_MOTION) gsap.globalTimeline.timeScale(4)

renderHeader(document.getElementById('site-header'))
renderFooter(document.getElementById('site-footer'))
renderBackToTop(document.body)
sound.syncMusic()

/* Retroalimentación sonora de los botones "¡Hacer mi avatar!", estén donde estén */
document.addEventListener('click', e => {
  if (e.target.closest('.btn--cta')) sound.fx('button')
})

route('/', homeView)
route('/personalizar', customizerView)
route('/listo', finalView)
route('/pedido', orderView)
route('/confirmacion', confirmationView)
route('/tarjeta', cardView)
route('/info', infoView)

startRouter(document.getElementById('app'))
