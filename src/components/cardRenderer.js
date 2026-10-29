import { CARD } from '../data/content.js'
import { hashString } from '../utils/format.js'

/* ==========================================================================
   GENERADOR DE LA TARJETA COLECCIONABLE (canvas 2D → PNG)
   El fondo es la plantilla SVG del tema (static/images/tarjetas). Encima se dibujan
   el retrato y los textos en los mismos lugares que tenían en el diseño.
   Tamaño: 750 × 1050 px (proporción 5:7, como una carta coleccionable).
   ========================================================================== */

export const CARD_W = 750
export const CARD_H = 1050

/* Medidas de la plantilla (viewBox 1315 × 1842), tomadas del diseño en Illustrator */
const TPL_W = 1315
const TPL = {
  number: { x: 1143.4, y: 216.7, size: 78.6 }, // caja blanca de arriba a la derecha
  portrait: { x: 657.5, bottom: 1450, size: 1120 }, // de pie sobre la colina
  shadow: { x: 657.5, y: 1408, rx: 250, ry: 34 },
  name: { x: 657.5, y: 1621, size: 117.5, maxWidth: 1000 },
  birthday: { x: 594, y: 1773.4, size: 98.3 },
  code: { x: 986.4, y: 1767.2, size: 29.6 }
}

function loadImage (src) {
  return new Promise(resolve => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function cardSerial (avatar) {
  return String(hashString(JSON.stringify(avatar)) % 100000).padStart(5, '0')
}

/** Código largo del pie ("00 - 000 - 000"), también derivado del avatar. */
function cardCode (avatar) {
  const n = String(hashString('codigo' + JSON.stringify(avatar)) % 100000000).padStart(8, '0')
  return `${n.slice(0, 2)} - ${n.slice(2, 5)} - ${n.slice(5)}`
}

/**
 * Dibuja la tarjeta.
 * @param {object} o { portrait (dataURL), name, birthday ("dd/mm", opcional), theme (id), avatar }
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function drawCard (o) {
  await Promise.all([
    document.fonts.load('800 60px "Nunito"'),
    document.fonts.load('400 40px "Nunito"'),
    document.fonts.load('200 20px "Nunito"')
  ]).catch(() => {})

  const theme = CARD.themes.find(t => t.id === o.theme) || CARD.themes[0]
  const c = document.createElement('canvas')
  c.width = CARD_W
  c.height = CARD_H
  const ctx = c.getContext('2d')
  const [bg, img] = await Promise.all([loadImage(theme.svg), loadImage(o.portrait)])

  // Todo se dibuja en las unidades de la plantilla
  ctx.scale(CARD_W / TPL_W, CARD_W / TPL_W)
  if (bg) ctx.drawImage(bg, 0, 0, TPL_W, TPL_W * CARD_H / CARD_W)

  // Retrato con una sombra suave a sus pies
  const { shadow: sh, portrait: pt } = TPL
  ctx.fillStyle = 'rgba(0, 0, 0, .16)'
  ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sh.rx, sh.ry, 0, 0, Math.PI * 2); ctx.fill()
  if (img) ctx.drawImage(img, pt.x - pt.size / 2, pt.bottom - pt.size, pt.size, pt.size)

  ctx.textBaseline = 'alphabetic'
  // Número de la tarjeta, en el color del tema
  ctx.textAlign = 'center'
  ctx.fillStyle = theme.accent
  ctx.font = `800 ${TPL.number.size}px "Nunito", sans-serif`
  ctx.fillText(cardSerial(o.avatar).slice(-3), TPL.number.x, TPL.number.y)

  // Nombre (se achica si no cabe sobre la línea)
  ctx.fillStyle = '#FFFFFF'
  const name = (o.name || 'Tu avatar').slice(0, 18)
  let size = TPL.name.size
  do { ctx.font = `800 ${size}px "Nunito", sans-serif`; size -= 4 } while (ctx.measureText(name).width > TPL.name.maxWidth && size > 50)
  ctx.fillText(name, TPL.name.x, TPL.name.y)

  // Cumpleaños junto al icono de hoja y código del pie
  ctx.textAlign = 'left'
  ctx.font = `400 ${TPL.birthday.size}px "Nunito", sans-serif`
  ctx.fillText(o.birthday || '--/--', TPL.birthday.x, TPL.birthday.y)
  ctx.font = `200 ${TPL.code.size}px "Nunito", sans-serif`
  ctx.fillText(cardCode(o.avatar), TPL.code.x, TPL.code.y)
  return c
}
