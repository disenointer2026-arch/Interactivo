import * as THREE from 'three'
import { mesh, group, placeOnHead } from './helpers.js'

/* Rasgos faciales: origen en el centro de la cabeza.
   placeOnHead() pega cada rasgo sobre la superficie y lo orienta hacia afuera. */

const EYE_X = 0.17
const EYE_Y = 0.0
const LINE = '#563028' // café oscuro del contorno en los botones de ojos
const TAU = Math.PI * 2

function pairOfEyes (ctx, buildOne) {
  const g = group()
  ;[-1, 1].forEach(s => {
    const eye = buildOne(ctx, s)
    eye.userData.eye = true // se usa para el parpadeo
    // Los ojos son calcomanías planas (como en el juego); se separan un poco de la cara
    // para que los bordes no se hundan en la curva de la cabeza
    const holder = placeOnHead(group(eye), ctx.dims, s * EYE_X, EYE_Y, 0.008)
    g.add(holder)
  })
  return g
}

/* ---------- Piezas planas de los ojos (z = capa, para que no se mezclen) ---------- */

/* Los ojos son dibujos planos: material sin luz, para que se vean con los colores
   exactos de los botones (con luz, el blanco y el iris se deslavaban) */
function flat (color) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false })
}

/** Igual, pero con el color de un rol (iris = color de ojos, párpado = piel). */
function flatRole (M, role, shade = 1) {
  const lit = M.role(role, { shade })
  const m = flat(lit.color)
  m.userData = { ...lit.userData }
  lit.dispose()
  return m
}

/** Óvalo relleno. */
function oval (rx, ry, mat, z, cx = 0, cy = 0) {
  return mesh(new THREE.CircleGeometry(1, 48), mat, { pos: [cx, cy, z], scale: [rx, ry, 1] })
}

/** Trazo curvo sobre un óvalo, del ángulo a0 al a1 (0 = derecha, PI/2 = arriba). */
function arc (rx, ry, t, mat, z, a0, a1, cy = 0) {
  const n = 40
  const shape = new THREE.Shape()
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n
    const x = Math.cos(a) * (rx + t / 2)
    const y = Math.sin(a) * (ry + t / 2)
    if (i) shape.lineTo(x, y)
    else shape.moveTo(x, y)
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + (a1 - a0) * i / n
    shape.lineTo(Math.cos(a) * (rx - t / 2), Math.sin(a) * (ry - t / 2))
  }
  return mesh(new THREE.ShapeGeometry(shape), mat, { pos: [0, cy, z] })
}

/** Párpado: la parte del óvalo por encima (o por debajo) de la recta y = y0 + k·x. */
function lid (rx, ry, mat, z, y0, k, above) {
  const pts = []
  for (let i = 0; i < 64; i++) pts.push(new THREE.Vector2(Math.cos(i / 64 * TAU) * rx, Math.sin(i / 64 * TAU) * ry))
  const side = p => (p.y - (y0 + k * p.x)) * (above ? 1 : -1)
  const out = []
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    if (side(p) >= 0) out.push(p)
    if ((side(p) >= 0) !== (side(q) >= 0)) out.push(p.clone().lerp(q, side(p) / (side(p) - side(q))))
  })
  return mesh(new THREE.ShapeGeometry(new THREE.Shape(out)), mat, { pos: [0, 0, z] })
}

/** Pestaña: trazo recto que sale del punto (x, y) en la dirección del ángulo a (0 = hacia arriba). */
function lash (mat, x, y, a, len = 0.03, r = 0.0055) {
  const dx = Math.sin(a)
  const dy = Math.cos(a)
  const d = len / 2 + r
  return mesh(new THREE.CapsuleGeometry(r, len, 3, 8), mat, { pos: [x + dx * d, y + dy * d, 0.002], rot: [0, 0, -a], scale: [1, 1, 0.3] })
}

/** Ojo base: contorno (completo o solo arriba), blanco e iris (con el color elegido). */
function baseEye (M, { rx, ry, t = 0.011, top = false }) {
  const line = flat(LINE)
  const g = group(
    top ? arc(rx, ry, t * 1.2, line, 0.003, -0.15, Math.PI + 0.15) : oval(rx + t, ry + t, line, 0),
    oval(rx, ry, flat('#FFFFFF'), 0.0015),
    // El iris mira hacia la derecha, como en los botones
    oval(rx * 0.62, ry * 0.68, flatRole(M, 'eye'), 0.0025, rx * 0.28, ry * 0.06)
  )
  g.userData = { line, rx, ry, t }
  return g
}

/** Tres pestañas repartidas sobre el contorno, arriba (dir = 1) o abajo (dir = -1). */
function lashes (g, dir) {
  const { line, rx, ry, t } = g.userData
  ;[-0.6, 0, 0.6].forEach(a => {
    const th = dir * (Math.PI / 2 - a * 0.9)
    const x = Math.cos(th) * (rx + t * 0.5)
    const y = Math.sin(th) * (ry + t * 0.5)
    g.add(lash(line, x, y, dir > 0 ? a : Math.PI - a))
  })
  return g
}

/* Los 8 estilos siguen los botones static/images/ui/botones-ojos-0N.png.
   s = lado del ojo (-1 izquierda, 1 derecha, vistos de frente); "afuera" es hacia s. */
export const eyeParts = {
  // botones-ojos-01: contorno solo arriba y una pestaña curva hacia afuera
  lashes: ctx => pairOfEyes(ctx, ({ M }, s) => {
    const g = baseEye(M, { rx: 0.072, ry: 0.098, top: true })
    g.add(lash(g.userData.line, s * 0.068, 0.07, s * 0.95, 0.026, 0.007))
    return g
  }),
  // botones-ojos-02: óvalo con contorno completo
  classic: ctx => pairOfEyes(ctx, ({ M }) => baseEye(M, { rx: 0.066, ry: 0.098 })),
  // botones-ojos-03: más angosto, con tres pestañas arriba
  lashesTop: ctx => pairOfEyes(ctx, ({ M }) => lashes(baseEye(M, { rx: 0.056, ry: 0.086 }), 1)),
  // botones-ojos-04: párpado caído, más bajo hacia afuera
  sleepy: ctx => pairOfEyes(ctx, ({ M }, s) => {
    const rx = 0.066
    const ry = 0.075
    const g = baseEye(M, { rx, ry })
    g.add(lid(rx + 0.012, ry + 0.012, flatRole(M, 'skin', 0.86), 0.0035, 0.1 * ry, -s * 0.3 * ry / rx, true))
    return g
  }),
  // botones-ojos-08: como el 01, sin pestaña
  soft: ctx => pairOfEyes(ctx, ({ M }) => baseEye(M, { rx: 0.072, ry: 0.098, top: true })),
  // botones-ojos-07: redondo, con ceja
  brow: ctx => pairOfEyes(ctx, ({ M }) => {
    const rx = 0.062
    const ry = 0.07
    const g = baseEye(M, { rx, ry })
    g.add(arc(rx * 1.05, ry * 0.9, 0.014, g.userData.line, 0.002, Math.PI * 0.22, Math.PI * 0.78, ry * 0.62))
    return g
  }),
  // botones-ojos-06: más angosto, con tres pestañas abajo
  lashesBottom: ctx => pairOfEyes(ctx, ({ M }) => lashes(baseEye(M, { rx: 0.056, ry: 0.086 }), -1)),
  // botones-ojos-05: mejillas que suben (párpado inferior)
  happy: ctx => pairOfEyes(ctx, ({ M }) => {
    const rx = 0.066
    const ry = 0.075
    const g = baseEye(M, { rx, ry })
    g.add(lid(rx + 0.012, ry + 0.012, flatRole(M, 'skin', 0.86), 0.0035, -0.04 * ry, 0, false))
    return g
  })
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

/* ---------- Boca ---------- */
const MOUTH_Y = -0.21
function mouth (ctx, build) {
  return placeOnHead(group(build(ctx)), ctx.dims, 0, MOUTH_Y, 0.006)
}

export const mouthParts = {
  smile: ctx => mouth(ctx, ({ M }) => mesh(new THREE.TorusGeometry(0.06, 0.013, 8, 20, Math.PI), M.role('mouth'), { rot: [0, 0, Math.PI], pos: [0, 0.03, 0] })),
  open: ctx => mouth(ctx, ({ M }) => group(
    mesh(new THREE.CircleGeometry(0.068, 24, Math.PI, Math.PI), M.role('mouth', { side: THREE.DoubleSide }), { pos: [0, 0.03, 0] }),
    mesh(new THREE.CircleGeometry(0.035, 16, Math.PI, Math.PI), M.fixed('#F08A8A', { side: THREE.DoubleSide }), { pos: [0, -0.01, 0.002] })
  )),
  neutral: ctx => mouth(ctx, ({ M }) => mesh(new THREE.CapsuleGeometry(0.012, 0.07, 4, 8), M.role('mouth'), { rot: [0, 0, Math.PI / 2] })),
  /* Sonrisa con un diente asomando por debajo del centro */
  teeth: ctx => mouth(ctx, ({ M }) => group(
    mesh(new THREE.TorusGeometry(0.06, 0.013, 8, 20, Math.PI), M.role('mouth'), { rot: [0, 0, Math.PI], pos: [0, 0.03, 0] }),
    mesh(new THREE.BoxGeometry(0.036, 0.03, 0.01), M.role('mouth'), { pos: [0, -0.042, -0.002] }),
    mesh(new THREE.BoxGeometry(0.024, 0.02, 0.01), M.fixed('#F7F6FB'), { pos: [0, -0.04, 0.004] })
  )),
  cat: ctx => mouth(ctx, ({ M }) => {
    const mat = M.role('mouth')
    const arc = new THREE.TorusGeometry(0.032, 0.011, 8, 16, Math.PI)
    return group(
      mesh(arc, mat, { rot: [0, 0, Math.PI], pos: [-0.031, 0.015, 0] }),
      mesh(arc, mat, { rot: [0, 0, Math.PI], pos: [0.031, 0.015, 0] })
    )
  }),
  o: ctx => mouth(ctx, ({ M }) => mesh(new THREE.TorusGeometry(0.03, 0.012, 8, 18), M.role('mouth')))
}
