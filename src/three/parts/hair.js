import * as THREE from 'three'
import { mesh, group } from './helpers.js'

/* Cabello: origen en el centro de la cabeza.
   Se construye con "casquetes" de esfera un poco más grandes que la cabeza.
   theta = qué tan abajo llega (0 = coronilla, PI = barbilla)
   gap   = abertura frontal para dejar libre la cara (en radianes) */

const TAU = Math.PI * 2

function shell (R, thetaLen, gap = 0) {
  const phiStart = Math.PI / 2 + gap / 2
  return new THREE.SphereGeometry(R, 40, 24, phiStart, TAU - gap, 0, thetaLen)
}

function base (ctx, { top = 1.12, back = 1.75, gap = 2.3, puff = 1.07, widen = 1 } = {}) {
  const { dims: d, M } = ctx
  const mat = M.role('hair', { side: THREE.DoubleSide, rough: 0.7 })
  const R = d.headR * puff
  const g = group(
    mesh(shell(R, top, 0), mat),
    mesh(shell(R * 1.005, back, gap), mat)
  )
  g.scale.set(d.headScale[0] * widen, d.headScale[1], d.headScale[2])
  g.userData.mat = mat
  return g
}

export const hairParts = {
  none: () => group(),

  short: ctx => base(ctx),

  bangs: ctx => {
    const g = base(ctx, { top: 1.3, back: 1.9, gap: 2.1 })
    // Mechón lateral
    g.add(mesh(new THREE.SphereGeometry(0.12, 16, 12), g.userData.mat, {
      pos: [0.3, 0.14, 0.34], scale: [1.2, 0.55, 0.6], rot: [0, 0, -0.5]
    }))
    return g
  },

  spiky: ctx => {
    const g = base(ctx, { top: 1.02, back: 1.6, gap: 2.4 })
    const R = ctx.dims.headR
    const cone = new THREE.ConeGeometry(0.1, 0.26, 8)
    const spots = [[0, 0.95, 0.2], [0.3, 0.85, 0.15], [-0.3, 0.85, 0.15], [0.15, 0.9, -0.25], [-0.15, 0.9, -0.25], [0, 0.75, 0.55]]
    spots.forEach(([x, y, z]) => {
      const v = new THREE.Vector3(x, y, z).normalize()
      const m = mesh(cone, g.userData.mat)
      m.position.copy(v.clone().multiplyScalar(R * 1.0))
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)
      g.add(m)
    })
    return g
  },

  pompadour: ctx => {
    const g = base(ctx, { top: 1.05, back: 1.65 })
    g.add(mesh(new THREE.SphereGeometry(0.3, 24, 16), g.userData.mat, {
      pos: [0, 0.42, 0.18], scale: [1.15, 0.6, 0.85], rot: [-0.3, 0, 0]
    }))
    return g
  },

  curly: ctx => {
    const { dims: d, M } = ctx
    const mat = M.role('hair', { rough: 0.9 })
    mat.flatShading = true
    const g = group()
    const geo = new THREE.IcosahedronGeometry(0.15, 0)
    const n = 70
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const phi = i * 2.399963
      const v = new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r)
      const theta = Math.acos(v.y)
      const front = v.z > 0.35 && theta > 1.05
      if (theta > 1.85 || front) continue
      const m = mesh(geo, mat)
      m.position.copy(v.multiplyScalar(d.headR * 1.04))
      m.rotation.set(i, i * 0.7, 0)
      g.add(m)
    }
    g.scale.set(d.headScale[0] * 1.02, d.headScale[1], d.headScale[2])
    return g
  },

  bob: ctx => base(ctx, { top: 1.2, back: 2.25, gap: 1.9, puff: 1.1, widen: 1.06 }),

  ponytail: ctx => {
    const g = base(ctx, { top: 1.1, back: 1.7 })
    const mat = g.userData.mat
    g.add(mesh(new THREE.SphereGeometry(0.15, 16, 12), mat, { pos: [0, 0.18, -0.55] }))
    g.add(mesh(new THREE.CapsuleGeometry(0.1, 0.32, 4, 12), mat, { pos: [0, -0.08, -0.62], rot: [0.25, 0, 0] }))
    g.add(mesh(new THREE.TorusGeometry(0.075, 0.03, 8, 16), ctx.M.fixed('#E60012'), { pos: [0, 0.14, -0.6], rot: [1.3, 0, 0] }))
    return g
  },

  buns: ctx => {
    const g = base(ctx, { top: 1.1, back: 1.65 })
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.SphereGeometry(0.17, 18, 14), g.userData.mat, { pos: [s * 0.32, 0.46, -0.04] }))
    })
    return g
  },

  long: ctx => {
    const g = base(ctx, { top: 1.15, back: 2.35, gap: 1.85, puff: 1.08 })
    g.add(mesh(new THREE.CapsuleGeometry(0.3, 0.42, 6, 16), g.userData.mat, {
      pos: [0, -0.45, -0.28], scale: [1.15, 1, 0.45]
    }))
    return g
  }
}
