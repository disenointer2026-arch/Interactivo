import { CARD } from '../data/content.js'
import { hashString } from '../utils/format.js'

/* ==========================================================================
   GENERADOR DE LA TARJETA COLECCIONABLE (canvas 2D → PNG)
   Diseño propio para la colaboración ficticia (no replica tarjetas oficiales).
   Tamaño: 750 × 1050 px (proporción 5:7, como una carta coleccionable).
   ========================================================================== */

export const CARD_W = 750
export const CARD_H = 1050

const INK = '#3A2E28'
const RED = '#E60012'
const PAPER = '#FFFBF2'
const WOOD = '#C99A63'

function rr (ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function leaf (ctx, x, y, s, rot, color, alpha = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(s, s)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -20)
  ctx.bezierCurveTo(14, -10, 14, 10, 0, 20)
  ctx.bezierCurveTo(-14, 10, -14, -10, 0, -20)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.6)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 16); ctx.stroke()
  ctx.restore()
}

/** Generador pseudoaleatorio determinista (la misma tarjeta se ve igual siempre). */
function rng (seed) {
  let s = seed || 1
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296
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

/**
 * Dibuja la tarjeta.
 * @param {object} o { portrait (dataURL), name, birthday (texto, opcional), theme (id), avatar, date }
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function drawCard (o) {
  await Promise.all([
    document.fonts.load('900 60px "Nunito"'),
    document.fonts.load('800 32px "Nunito"'),
    document.fonts.load('700 30px "Nunito"'),
    document.fonts.load('1000 34px "Nunito"')
  ]).catch(() => {})

  const theme = CARD.themes.find(t => t.id === o.theme) || CARD.themes[0]
  const c = document.createElement('canvas')
  c.width = CARD_W
  c.height = CARD_H
  const ctx = c.getContext('2d')
  const serial = cardSerial(o.avatar)
  const rand = rng(Number(serial) + theme.id.length)

  // Marco exterior
  rr(ctx, 0, 0, CARD_W, CARD_H, 44)
  ctx.fillStyle = PAPER
  ctx.fill()
  ctx.save()
  rr(ctx, 0, 0, CARD_W, CARD_H, 44)
  ctx.clip()
  // Borde con puntadas
  ctx.strokeStyle = theme.leaf
  ctx.globalAlpha = 0.35
  ctx.setLineDash([10, 10])
  ctx.lineWidth = 3
  rr(ctx, 16, 16, CARD_W - 32, CARD_H - 32, 34)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  // Ventana de ilustración
  const ax = 40; const ay = 108; const aw = CARD_W - 80; const ah = 600
  ctx.save()
  rr(ctx, ax, ay, aw, ah, 30)
  ctx.clip()
  const g = ctx.createLinearGradient(0, ay, 0, ay + ah)
  g.addColorStop(0, theme.from)
  g.addColorStop(1, theme.to)
  ctx.fillStyle = g
  ctx.fillRect(ax, ay, aw, ah)

  // Sol / luna
  ctx.fillStyle = theme.id === 'night' ? '#FFF8E1' : '#FFE9A8'
  ctx.globalAlpha = 0.9
  ctx.beginPath(); ctx.arc(ax + aw - 110, ay + 110, 54, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1
  // Nubes o estrellas
  for (let i = 0; i < 7; i++) {
    const x = ax + 30 + rand() * (aw - 60)
    const y = ay + 30 + rand() * 180
    ctx.fillStyle = 'rgba(255,255,255,.7)'
    if (theme.id === 'night') { ctx.beginPath(); ctx.arc(x, y, 3 + rand() * 3, 0, Math.PI * 2); ctx.fill() } else {
      ctx.beginPath(); ctx.ellipse(x, y, 34 + rand() * 20, 12, 0, 0, Math.PI * 2); ctx.fill()
    }
  }
  // Colinas
  const hill = (y, color, amp) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(ax, ay + ah)
    ctx.lineTo(ax, y)
    for (let x = 0; x <= aw; x += 20) ctx.lineTo(ax + x, y + Math.sin(x / 90 + amp) * 18)
    ctx.lineTo(ax + aw, ay + ah)
    ctx.fill()
  }
  hill(ay + ah - 190, theme.leaf + '55', 1)
  hill(ay + ah - 130, theme.leaf + '99', 3)
  hill(ay + ah - 70, theme.leaf, 5)
  // Hojas decorativas
  for (let i = 0; i < 10; i++) {
    leaf(ctx, ax + rand() * aw, ay + 40 + rand() * (ah - 80), 0.6 + rand() * 0.6, rand() * 6, i % 3 ? theme.leaf : RED, i % 3 ? 0.35 : 0.2)
  }
  // Sombra y retrato
  ctx.fillStyle = 'rgba(58,46,40,.16)'
  ctx.beginPath(); ctx.ellipse(ax + aw / 2, ay + ah - 88, 150, 22, 0, 0, Math.PI * 2); ctx.fill()
  const img = await loadImage(o.portrait)
  if (img) {
    const s = 560
    ctx.drawImage(img, ax + (aw - s) / 2, ay + ah - s - 64, s, s)
  }
  ctx.restore()
  // Brillo del marco de la ilustración
  ctx.strokeStyle = 'rgba(255,255,255,.9)'
  ctx.lineWidth = 6
  rr(ctx, ax, ay, aw, ah, 30)
  ctx.stroke()

  // Encabezado: lockup tipográfico
  ctx.textBaseline = 'middle'
  ctx.fillStyle = RED
  ctx.font = '1000 34px "Nunito", sans-serif'
  ctx.fillText('MINISO', 52, 62)
  const mw = ctx.measureText('MINISO').width
  ctx.fillStyle = INK
  ctx.font = '700 28px "Nunito", sans-serif'
  ctx.fillText('×', 52 + mw + 12, 62)
  ctx.font = '900 32px "Nunito", sans-serif'
  ctx.fillStyle = '#2F5D46'
  ctx.fillText('Animal Crossing', 52 + mw + 40, 64)
  // Serie
  ctx.textAlign = 'right'
  ctx.font = '700 22px "Nunito", sans-serif'
  ctx.fillStyle = INK
  ctx.globalAlpha = 0.7
  ctx.fillText(CARD.series.toUpperCase(), CARD_W - 52, 62)
  ctx.globalAlpha = 1
  ctx.textAlign = 'left'

  // Placa de nombre (madera)
  const py = ay + ah - 34
  ctx.fillStyle = 'rgba(58,46,40,.15)'
  rr(ctx, 92, py + 8, CARD_W - 184, 96, 48); ctx.fill()
  ctx.fillStyle = WOOD
  rr(ctx, 92, py, CARD_W - 184, 96, 48); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  rr(ctx, 104, py + 8, CARD_W - 208, 30, 15); ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  let size = 60
  const name = (o.name || 'Tu avatar').slice(0, 18)
  do { ctx.font = `900 ${size}px "Nunito", sans-serif`; size -= 2 } while (ctx.measureText(name).width > CARD_W - 260 && size > 30)
  ctx.fillText(name, CARD_W / 2, py + 52)

  // Datos del personaje (el cumpleaños solo aparece cuando se ha elegido)
  const rows = o.birthday ? [['Cumpleaños', o.birthday]] : []
  let y = py + 150
  rows.forEach(([k, v]) => {
    ctx.textAlign = 'left'
    ctx.fillStyle = theme.leaf
    ctx.beginPath(); ctx.arc(84, y, 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = INK
    ctx.globalAlpha = 0.65
    ctx.font = '700 24px "Nunito", sans-serif'
    ctx.fillText(k, 108, y)
    ctx.globalAlpha = 1
    ctx.textAlign = 'right'
    ctx.font = '800 32px "Nunito", sans-serif'
    ctx.fillText(v, CARD_W - 64, y + 2)
    ctx.strokeStyle = 'rgba(58,46,40,.12)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 8])
    ctx.beginPath(); ctx.moveTo(64, y + 32); ctx.lineTo(CARD_W - 64, y + 32); ctx.stroke()
    ctx.setLineDash([])
    y += 70
  })

  // Pie: sello "Hecho por ti" + número
  const fy = CARD_H - 70
  ctx.fillStyle = RED
  rr(ctx, 52, fy - 26, 190, 52, 26); ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.font = '800 26px "Nunito", sans-serif'
  ctx.fillText('Hecho por ti', 147, fy + 2)
  ctx.textAlign = 'right'
  ctx.fillStyle = INK
  ctx.globalAlpha = 0.7
  ctx.font = '700 22px "Nunito", sans-serif'
  ctx.fillText(`N.º ${serial} · ${o.date || ''}`, CARD_W - 56, fy)
  ctx.globalAlpha = 1
  leaf(ctx, 272, fy, 0.8, 0.6, theme.leaf, 0.8)

  ctx.restore()
  return c
}
