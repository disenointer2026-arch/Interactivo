import * as THREE from 'three'
import { mesh, group } from './helpers.js'

/* Cada constructor recibe ctx = { dims, M, config } y devuelve un THREE.Object3D.
   - dims: medidas del cuerpo (ver avatarDims.js)
   - M:    kit de materiales (M.role('skin') o M.fixed('#hex'))
   Las piezas del cuerpo se construyen con origen en los pies (suelo). */

function buildBody ({ dims: d, M }) {
  const skin = M.role('skin')
  const g = group()

  // Torso
  g.add(mesh(new THREE.CapsuleGeometry(d.torsoR, d.torsoH, 6, 20), skin, {
    pos: [0, d.torsoY, 0], scale: [1, 1, 0.88]
  }))

  // Cuello
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 14), skin, { pos: [0, d.torsoTop - 0.02, 0] }))

  // Brazos y manos
  d.arms.forEach(a => {
    const mid = a.shoulder.clone().addScaledVector(a.dir, d.armLen / 2)
    g.add(mesh(new THREE.CapsuleGeometry(d.armR, d.armLen, 4, 12), skin, {
      pos: mid.toArray(), rot: [0, 0, a.angle]
    }))
    g.add(mesh(new THREE.SphereGeometry(d.armR * 1.35, 14, 10), skin, { pos: a.hand.toArray() }))
  })

  // Piernas
  const legH = d.hipY - d.shoeH * 0.5
  ;[-1, 1].forEach(s => {
    g.add(mesh(new THREE.CylinderGeometry(d.legR, d.legR * 0.92, legH, 14), skin, {
      pos: [s * d.legX, d.shoeH * 0.5 + legH / 2, 0]
    }))
  })
  return g
}

function buildHead ({ dims: d, M }) {
  const skin = M.role('skin')
  return group(
    mesh(new THREE.SphereGeometry(d.headR, 40, 28), skin, { scale: d.headScale })
  )
}

/* ---------- Orejas (origen en el centro de la cabeza) ---------- */
function ears (builder) {
  return ({ dims: d, M }) => {
    const skin = M.role('skin', { shade: 0.95 })
    const g = group()
    ;[-1, 1].forEach(s => {
      const e = builder(skin, d)
      e.position.set(s * d.earX, d.earY, 0)
      e.scale.x *= s
      g.add(e)
    })
    return g
  }
}

export const bodyParts = {
  body: {
    default: buildBody
  },
  head: {
    default: buildHead
  },
  ears: {
    round: ears(skin => mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, { scale: [0.55, 1, 0.8] })),
    small: ears(skin => mesh(new THREE.SphereGeometry(0.07, 14, 10), skin, { scale: [0.55, 1, 0.8] })),
    big: ears(skin => mesh(new THREE.SphereGeometry(0.14, 16, 12), skin, { scale: [0.5, 1, 0.75] })),
    pointy: ears(skin => mesh(new THREE.ConeGeometry(0.075, 0.24, 12), skin, {
      pos: [0.05, 0.05, 0], rot: [0, 0, -1.0], scale: [1, 1, 0.55]
    }))
  }
}
