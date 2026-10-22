import * as THREE from 'three'

const Z = new THREE.Vector3(0, 0, 1)

/** Crea una malla con posición, rotación y escala en una sola línea. */
export function mesh (geo, mat, { pos, rot, scale } = {}) {
  const m = new THREE.Mesh(geo, mat)
  if (pos) m.position.set(pos[0], pos[1], pos[2])
  if (rot) m.rotation.set(rot[0], rot[1], rot[2])
  if (scale !== undefined) {
    if (typeof scale === 'number') m.scale.setScalar(scale)
    else m.scale.set(scale[0], scale[1], scale[2])
  }
  m.castShadow = true
  return m
}

export function group (...children) {
  const g = new THREE.Group()
  children.flat().forEach(c => c && g.add(c))
  return g
}

/** Profundidad de la cara del modelo en (x, y), interpolando su cuadrícula. */
function faceDepth (face, x, y) {
  const { x0, y0, step, rows } = face
  const cols = rows[0].length
  const fx = THREE.MathUtils.clamp((x - x0) / step, 0, cols - 1.001)
  const fy = THREE.MathUtils.clamp((y - y0) / step, 0, rows.length - 1.001)
  const i = Math.floor(fx)
  const j = Math.floor(fy)
  const tx = fx - i
  const ty = fy - j
  const a = rows[j][i] + (rows[j][i + 1] - rows[j][i]) * tx
  const b = rows[j + 1][i] + (rows[j + 1][i + 1] - rows[j + 1][i]) * tx
  return a + (b - a) * ty
}

/** Punto sobre la superficie de la cara del modelo. x, y están en medidas
    procedurales; el resultado también, porque luego se escala con headFit. */
function onModelFace (dims, x, y, lift) {
  const [fx, fy, fz] = dims.headFit
  const X = x * fx
  const Y = y * fy
  const e = 0.01
  const dzx = (faceDepth(dims.face, X + e, Y) - faceDepth(dims.face, X - e, Y)) / (2 * e)
  const dzy = (faceDepth(dims.face, X, Y + e) - faceDepth(dims.face, X, Y - e)) / (2 * e)
  const n = new THREE.Vector3(-dzx * fx, -dzy * fy, fz).normalize()
  const p = new THREE.Vector3(x, y, faceDepth(dims.face, X, Y) / fz).addScaledVector(n, lift)
  return { p, n }
}

/** Punto sobre la superficie de la cabeza (elipsoide) a partir de x, y locales. */
export function onHead (dims, x, y, lift = 0) {
  if (dims.face) return onModelFace(dims, x, y, lift)
  const r = dims.headR
  const [sx, sy, sz] = dims.headScale
  const nx = x / (r * sx)
  const ny = y / (r * sy)
  const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * r * sz
  const n = new THREE.Vector3(x / (sx * sx), y / (sy * sy), z / (sz * sz)).normalize()
  const p = new THREE.Vector3(x, y, z).addScaledVector(n, lift)
  return { p, n }
}

/** Coloca un objeto sobre la cara, mirando hacia afuera de la cabeza. */
export function placeOnHead (obj, dims, x, y, lift = 0.004) {
  const { p, n } = onHead(dims, x, y, lift)
  obj.position.copy(p)
  obj.quaternion.setFromUnitVectors(Z, n)
  return obj
}

/** Forma de hoja (para estampados, collares, corona…). */
export function leafShape (w = 0.1, h = 0.16) {
  const s = new THREE.Shape()
  s.moveTo(0, -h / 2)
  s.bezierCurveTo(w * 0.9, -h * 0.25, w * 0.7, h * 0.35, 0, h / 2)
  s.bezierCurveTo(-w * 0.7, h * 0.35, -w * 0.9, -h * 0.25, 0, -h / 2)
  return s
}

/** Textura de rayas (blanco/gris) que se tiñe con el color del material. */
export function stripeTexture () {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 64
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 8, 64)
  ctx.fillStyle = '#b9b9b9'
  for (let y = 0; y < 64; y += 16) ctx.fillRect(0, y, 8, 8)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, 3)
  t.magFilter = THREE.NearestFilter
  return t
}
