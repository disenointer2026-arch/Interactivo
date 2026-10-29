import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { mesh, group, placeOnHead, onHead } from './helpers.js'
import { headGeometry } from '../PartLoader.js'

/* Rasgos faciales: origen en el centro de la cabeza.
   placeOnHead() pega cada rasgo sobre la superficie y lo orienta hacia afuera. */

/* Rasgos dibujados (ojos y boca): material sin luz, para que se vean con los colores
   exactos del diseño (con luz, el blanco y el iris se deslavaban) */
function flat (color) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false })
}

/** Igual, pero con el color de un rol (iris = color de ojos, boca = color de boca). */
function flatRole (M, role, shade = 1) {
  const lit = M.role(role, { shade })
  const m = flat(lit.color)
  m.userData = { ...lit.userData }
  lit.dispose()
  return m
}

/* ---------- Ojos ----------
   Mapas UV del diseño (static/images/ojos, preparados con tools/blender/prepare_eye_maps.py):
   se pintan sobre la propia malla de la cabeza, en tres capas:
   blanco + contorno → iris (con el color de ojos elegido) → contorno y párpado encima.
   Las imágenes son solo la zona de los ojos del mapa UV; repeat/offset las ubican. */
const EYE_CROP = { x: 0.616822, y: 0.735191, w: 0.224299, h: 0.131117 } // en el mapa UV (origen arriba)
const texLoader = new THREE.TextureLoader()
const texCache = new Map()

function eyeTexture (url) {
  if (!texCache.has(url)) {
    texCache.set(url, texLoader.loadAsync(url).then(t => {
      t.colorSpace = THREE.SRGBColorSpace
      t.flipY = false // las UV del .glb tienen el origen arriba, como la imagen
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
      return t
    }))
  }
  return texCache.get(url)
}

async function uvEyes (ctx, n) {
  const { M } = ctx
  const [geo, ...maps] = await Promise.all([
    headGeometry(),
    ...['base', 'iris', 'lineas'].map(k => eyeTexture(`images/ojos/${n}-${k}.png`))
  ])
  const g = group()
  // Copia propia de cada textura: se libera junto con la pieza
  const layers = maps.map(t => t.clone())
  const mats = [flat('#FFFFFF'), flatRole(M, 'eye'), flat('#FFFFFF')]
  layers.forEach((t, i) => {
    t.repeat.set(1 / EYE_CROP.w, 1 / EYE_CROP.h)
    t.offset.set(-EYE_CROP.x / EYE_CROP.w, -EYE_CROP.y / EYE_CROP.h)
    Object.assign(mats[i], {
      map: t, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1 - i, polygonOffsetUnits: -4 - i
    })
    const m = new THREE.Mesh(geo, mats[i])
    m.renderOrder = 1 + i
    // La geometría es la de la cabeza: no se libera con la pieza, solo su material
    m.userData.fromGLB = true
    m.userData.ownMaterial = true
    g.add(m)
  })
  return g
}

/* Los 8 estilos siguen los botones static/images/ui/botones-ojos-0N.png.
   El 8 (Sonrientes) es el 7 (Soñolientos) volteado de arriba abajo. */
export const eyeParts = {
  lashes: ctx => uvEyes(ctx, 1),
  soft: ctx => uvEyes(ctx, 2),
  classic: ctx => uvEyes(ctx, 3),
  brow: ctx => uvEyes(ctx, 4),
  lashesTop: ctx => uvEyes(ctx, 5),
  lashesBottom: ctx => uvEyes(ctx, 6),
  sleepy: ctx => uvEyes(ctx, 7),
  happy: ctx => uvEyes(ctx, 8)
}

/* ---------- Nariz ---------- */
const NOSE_Y = -0.1
function nose (ctx, build) {
  return placeOnHead(group(build(ctx)), ctx.dims, 0, NOSE_Y, 0.0)
}

export const noseParts = {
  button: ctx => nose(ctx, ({ M }) => mesh(new THREE.SphereGeometry(0.045, 16, 12), M.role('skin', { shade: 0.9 }), { scale: [1.2, 0.9, 0.8] })),
  triangle: ctx => nose(ctx, ({ M }) => mesh(new THREE.ConeGeometry(0.05, 0.09, 3), M.role('skin', { shade: 0.9 }), { rot: [Math.PI / 2, 0, 0], pos: [0, 0, 0.02] })),
  round: ctx => nose(ctx, ({ M }) => mesh(new THREE.SphereGeometry(0.07, 18, 14), M.role('skin', { shade: 0.88 }), { scale: [1.15, 0.95, 0.8] })),
  dot: ctx => nose(ctx, ({ M }) => mesh(new THREE.SphereGeometry(0.025, 12, 10), M.role('skin', { shade: 0.72 }), { scale: [1.2, 0.9, 0.7] }))
}

/* ---------- Boca ----------
   Las bocas son los dibujos SVG del diseño (static/images/bocas), convertidos en
   calcomanías planas sobre la cara, como los ojos. El café toma el color de boca y
   el blanco (el diente) queda fijo. */
const MOUTH_Y = -0.21
const MOUTH_SCALE = 0.00033 // unidades de la cabeza por pixel del SVG (sonrisa de ~0,27 de ancho, como en el juego)
const svgLoader = new SVGLoader()
const svgCache = new Map()

function loadSvg (url) {
  if (!svgCache.has(url)) svgCache.set(url, fetch(url).then(r => r.text()).then(t => svgLoader.parse(t)))
  return svgCache.get(url)
}

/** Parte los triángulos hasta que ningún lado mida más de maxLen. Así, al pegar el
    dibujo sobre la cara curva, ningún triángulo largo la atraviesa por dentro. */
function subdivide (geo, maxLen) {
  const src = geo.index ? geo.toNonIndexed() : geo
  const p = src.attributes.position
  const stack = []
  for (let i = 0; i < p.count; i += 3) {
    stack.push([0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(p, i + k)))
  }
  const out = []
  while (stack.length) {
    const t = stack.pop()
    const edges = [[0, 1], [1, 2], [2, 0]].map(([a, b]) => [a, b, t[a].distanceTo(t[b])])
    const [a, b, len] = edges.reduce((m, e) => (e[2] > m[2] ? e : m))
    if (len <= maxLen) { out.push(...t); continue }
    const c = 3 - a - b
    const mid = t[a].clone().lerp(t[b], 0.5)
    stack.push([t[a], mid, t[c]], [mid, t[b], t[c]])
  }
  return new THREE.BufferGeometry().setFromPoints(out)
}

async function svgMouth (ctx, url) {
  const { M, dims } = ctx
  const data = await loadSvg(url)
  const parts = data.paths.map(path => {
    const fill = new THREE.Color(path.userData.style.fill)
    const geo = subdivide(new THREE.ShapeGeometry(SVGLoader.createShapes(path)), 30)
    geo.computeBoundingBox()
    return { geo, white: fill.r + fill.g + fill.b > 2.5 }
  })
  const box = new THREE.Box3()
  parts.forEach(p => box.union(p.geo.boundingBox))
  const c = box.getCenter(new THREE.Vector3())
  const g = group()
  parts.forEach(({ geo, white }, i) => {
    // Cada punto del dibujo se pega sobre la cara (se curva con ella): centrado,
    // escalado, con el eje y invertido (en SVG crece hacia abajo) y una capa por trazo
    // en el orden del SVG (el diente va detrás del contorno)
    const pos = geo.attributes.position
    for (let v = 0; v < pos.count; v++) {
      const x = (pos.getX(v) - c.x) * MOUTH_SCALE
      const y = MOUTH_Y - (pos.getY(v) - c.y) * MOUTH_SCALE
      pos.setXYZ(v, ...onHead(dims, x, y, 0.008 + i * 0.0015).p.toArray())
    }
    geo.computeBoundingBox() // la caja anterior era la del SVG sin escalar
    geo.computeBoundingSphere()
    const mat = white ? flat('#F8F7FC') : flatRole(M, 'mouth')
    mat.side = THREE.DoubleSide // al invertir el eje y los triángulos quedan al revés
    g.add(mesh(geo, mat))
  })
  return g
}

export const mouthParts = {
  smile: ctx => svgMouth(ctx, 'images/bocas/sonrisa.svg'),
  cat: ctx => svgMouth(ctx, 'images/bocas/gato.svg'),
  teeth: ctx => svgMouth(ctx, 'images/bocas/dientes.svg')
}
