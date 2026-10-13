import * as THREE from 'three'
import { mesh, group, placeOnHead } from './helpers.js'

/* Rasgos faciales: origen en el centro de la cabeza.
   placeOnHead() pega cada rasgo sobre la superficie y lo orienta hacia afuera. */

const EYE_X = 0.17
const EYE_Y = 0.0

function pairOfEyes (ctx, buildOne) {
  const g = group()
  ;[-1, 1].forEach(s => {
    const eye = buildOne(ctx, s)
    eye.userData.eye = true // se usa para el parpadeo
    const holder = placeOnHead(group(eye), ctx.dims, s * EYE_X, EYE_Y, 0.0)
    g.add(holder)
  })
  return g
}

const highlight = (M, x = 0.02, y = 0.03, r = 0.02) =>
  mesh(new THREE.SphereGeometry(r, 10, 8), M.fixed('#ffffff', { rough: 0.3 }), { pos: [x, y, 0.028] })

export const eyeParts = {
  round: ctx => pairOfEyes(ctx, ({ M }) => group(
    mesh(new THREE.SphereGeometry(0.068, 20, 14), M.role('eye', { rough: 0.35 }), { scale: [1, 1.22, 0.4] }),
    highlight(M)
  )),

  big: ctx => pairOfEyes(ctx, ({ M }) => group(
    mesh(new THREE.SphereGeometry(0.088, 22, 16), M.fixed('#FFFFFF', { rough: 0.4 }), { scale: [1, 1.18, 0.32] }),
    mesh(new THREE.SphereGeometry(0.062, 20, 14), M.role('eye', { rough: 0.3 }), { pos: [0, -0.005, 0.014], scale: [1, 1.15, 0.35] }),
    mesh(new THREE.SphereGeometry(0.03, 14, 10), M.fixed('#1E1714', { rough: 0.3 }), { pos: [0, -0.005, 0.028], scale: [1, 1.1, 0.4] }),
    highlight(M, 0.022, 0.03, 0.022)
  )),

  almond: ctx => pairOfEyes(ctx, ({ M }, s) => group(
    mesh(new THREE.SphereGeometry(0.06, 20, 14), M.role('eye', { rough: 0.35 }), {
      scale: [1.45, 0.78, 0.4], rot: [0, 0, s * 0.18]
    }),
    highlight(M, 0.025, 0.018, 0.016)
  )),

  happy: ctx => pairOfEyes(ctx, ({ M }) => group(
    mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 20, Math.PI), M.role('eye'), { pos: [0, -0.02, 0] })
  )),

  sleepy: ctx => pairOfEyes(ctx, ({ M }) => group(
    mesh(new THREE.SphereGeometry(0.062, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.role('eye', { rough: 0.35 }), {
      scale: [1.1, 1, 0.4], rot: [0, 0, 0]
    }),
    mesh(new THREE.CapsuleGeometry(0.012, 0.13, 4, 8), M.fixed('#3A2E28'), { rot: [0, 0, Math.PI / 2], pos: [0, 0.002, 0.006] })
  )),

  dot: ctx => pairOfEyes(ctx, ({ M }) => group(
    mesh(new THREE.SphereGeometry(0.036, 14, 10), M.role('eye', { rough: 0.35 }), { scale: [1, 1.2, 0.5] })
  ))
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
