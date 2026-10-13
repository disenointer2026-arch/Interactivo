import * as THREE from 'three'
import { mesh, group, leafShape, stripeTexture } from './helpers.js'

/* Ropa: origen en los pies. Todas las prendas se calculan con dims
   para ajustarse a cualquier tipo de cuerpo. */

function torsoShell (d, mat, grow = 1.07) {
  return mesh(new THREE.CapsuleGeometry(d.torsoR * grow, d.torsoH, 6, 22), mat, {
    pos: [0, d.torsoY, 0], scale: [1, 1, 0.88]
  })
}

function sleeves (d, mat, length = 0.45, grow = 1.4) {
  const g = group()
  d.arms.forEach(a => {
    const len = d.armLen * length
    const mid = a.shoulder.clone().addScaledVector(a.dir, len / 2)
    g.add(mesh(new THREE.CylinderGeometry(d.armR * grow, d.armR * (grow + 0.12), len, 14), mat, {
      pos: mid.toArray(), rot: [0, 0, a.angle]
    }))
    g.add(mesh(new THREE.SphereGeometry(d.armR * grow * 1.05, 14, 10), mat, { pos: a.shoulder.toArray() }))
  })
  return g
}

function chestFront (d, lift = 0.01) {
  return d.torsoR * 1.07 * 0.88 + lift
}

export const shirtParts = {
  basic: ({ dims: d, M }) => {
    const mat = M.role('shirt')
    return group(torsoShell(d, mat), sleeves(d, mat))
  },

  stamp: ({ dims: d, M }) => {
    const mat = M.role('shirt')
    const leaf = mesh(new THREE.ShapeGeometry(leafShape(0.12, 0.17)), M.fixed('#FFF8EA', { side: THREE.DoubleSide }), {
      pos: [0.03, d.torsoY + 0.03, chestFront(d, 0.004)], rot: [0, 0, -0.5]
    })
    const vein = mesh(new THREE.PlaneGeometry(0.008, 0.13), M.fixed('#7DB46C'), {
      pos: [0.03, d.torsoY + 0.03, chestFront(d, 0.007)], rot: [0, 0, -0.5]
    })
    return group(torsoShell(d, mat), sleeves(d, mat), leaf, vein)
  },

  stripes: ({ dims: d, M }) => {
    const mat = M.role('shirt', { map: stripeTexture() })
    return group(torsoShell(d, mat), sleeves(d, M.role('shirt')))
  },

  polo: ({ dims: d, M }) => {
    const mat = M.role('shirt')
    const collarMat = M.role('shirt', { shade: 1.35 })
    const g = group(torsoShell(d, mat), sleeves(d, mat))
    const y = d.torsoTop - 0.05
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.ConeGeometry(0.065, 0.1, 3), collarMat, {
        pos: [s * 0.07, y, d.torsoR * 0.62], rot: [0.9, 0, s * 2.6], scale: [1, 1, 0.35]
      }))
    })
    for (let i = 0; i < 3; i++) {
      g.add(mesh(new THREE.SphereGeometry(0.014, 8, 6), M.fixed('#FFF8EA'), {
        pos: [0, d.torsoY + 0.06 - i * 0.07, chestFront(d, 0.0)]
      }))
    }
    return g
  },

  hoodie: ({ dims: d, M }) => {
    const mat = M.role('shirt')
    const dark = M.role('shirt', { shade: 0.85 })
    const g = group(torsoShell(d, mat, 1.13), sleeves(d, mat, 1.0, 1.45))
    g.add(mesh(new THREE.TorusGeometry(0.17, 0.065, 10, 24), mat, {
      pos: [0, d.torsoTop - 0.06, -0.08], rot: [Math.PI / 2 - 0.35, 0, 0]
    }))
    g.add(mesh(new THREE.BoxGeometry(d.torsoR * 1.1, 0.1, 0.03), dark, {
      pos: [0, d.torsoY - 0.1, d.torsoR * 1.13 * 0.88 - 0.005]
    }))
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), M.fixed('#FFF8EA'), {
        pos: [s * 0.05, d.torsoTop - 0.14, d.torsoR * 0.95]
      }))
    })
    return g
  },

  dress: ({ dims: d, M }) => {
    const mat = M.role('shirt')
    const top = d.torsoTop - 0.04
    const bottom = d.hipY - d.legLen * 0.45
    const h = top - bottom
    const g = group(
      mesh(new THREE.CylinderGeometry(d.torsoR * 1.02, d.torsoR * 1.75, h, 28), mat, {
        pos: [0, bottom + h / 2, 0], scale: [1, 1, 0.9]
      }),
      mesh(new THREE.TorusGeometry(d.torsoR * 1.12, 0.022, 8, 28), M.fixed('#FFF8EA'), {
        pos: [0, d.torsoY - 0.02, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 0.9, 1]
      })
    )
    d.arms.forEach(a => {
      g.add(mesh(new THREE.SphereGeometry(d.armR * 1.8, 14, 10), mat, { pos: a.shoulder.toArray() }))
    })
    return g
  }
}

/* ---------- Parte inferior ---------- */
function hips (d, mat) {
  return mesh(new THREE.SphereGeometry(d.torsoR * 1.04, 22, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat, {
    pos: [0, d.hipY + 0.06, 0], scale: [1, 0.75, 0.9]
  })
}

function legs (d, mat, bottomY) {
  const g = group()
  const top = d.hipY + 0.04
  const h = top - bottomY
  ;[-1, 1].forEach(s => {
    g.add(mesh(new THREE.CylinderGeometry(d.legR * 1.32, d.legR * 1.25, h, 14), mat, {
      pos: [s * d.legX, bottomY + h / 2, 0]
    }))
  })
  return g
}

export const pantsParts = {
  jeans: ({ dims: d, M }) => {
    const mat = M.role('pants')
    return group(hips(d, mat), legs(d, mat, d.shoeH * 0.7))
  },

  joggers: ({ dims: d, M }) => {
    const mat = M.role('pants')
    const cuff = M.role('pants', { shade: 0.78 })
    const g = group(hips(d, mat), legs(d, mat, d.shoeH + 0.03))
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.CylinderGeometry(d.legR * 1.2, d.legR * 1.2, 0.05, 14), cuff, { pos: [s * d.legX, d.shoeH + 0.03, 0] }))
    })
    return g
  },

  shorts: ({ dims: d, M }) => {
    const mat = M.role('pants')
    return group(hips(d, mat), legs(d, mat, d.hipY - d.legLen * 0.45))
  },

  skirt: ({ dims: d, M }) => {
    const mat = M.role('pants')
    const top = d.hipY + 0.1
    const bottom = d.hipY - d.legLen * 0.5
    const h = top - bottom
    return group(mesh(new THREE.CylinderGeometry(d.torsoR * 1.05, d.torsoR * 1.55, h, 24), mat, {
      pos: [0, bottom + h / 2, 0], scale: [1, 1, 0.9]
    }))
  },

  overalls: ({ dims: d, M }) => {
    const mat = M.role('pants')
    const g = group(hips(d, mat), legs(d, mat, d.shoeH * 0.7))
    const z = d.torsoR * 1.07 * 0.88
    g.add(mesh(new THREE.BoxGeometry(d.torsoR * 1.05, d.torsoH * 0.5 + 0.12, 0.03), mat, {
      pos: [0, d.torsoY - 0.02, z - 0.004]
    }))
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.BoxGeometry(0.045, 0.3, 0.02), mat, {
        pos: [s * d.torsoR * 0.42, d.shoulderY - 0.03, z * 0.55], rot: [-0.9, 0, 0]
      }))
      g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10), M.fixed('#F6D365', { metal: 0.4, rough: 0.4 }), {
        pos: [s * d.torsoR * 0.38, d.torsoY + d.torsoH * 0.25, z + 0.014], rot: [Math.PI / 2, 0, 0]
      }))
    })
    return g
  }
}

/* ---------- Zapatos ---------- */
function pair (d, build) {
  const g = group()
  ;[-1, 1].forEach(s => {
    const shoe = build(s)
    shoe.position.set(s * d.legX, 0, 0.03)
    g.add(shoe)
  })
  return g
}

export const shoeParts = {
  sneakers: ({ dims: d, M }) => pair(d, () => group(
    mesh(new THREE.SphereGeometry(0.1, 18, 12), M.role('shoes'), { pos: [0, 0.07, 0.02], scale: [0.95, 0.62, 1.35] }),
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 18), M.fixed('#FFFFFF'), { pos: [0, 0.018, 0.02], scale: [0.98, 1, 1.4] })
  )),

  boots: ({ dims: d, M }) => pair(d, () => group(
    mesh(new THREE.CylinderGeometry(d.legR * 1.45, d.legR * 1.5, 0.2, 16), M.role('shoes'), { pos: [0, 0.12, 0] }),
    mesh(new THREE.SphereGeometry(0.1, 16, 12), M.role('shoes'), { pos: [0, 0.06, 0.05], scale: [0.95, 0.6, 1.25] }),
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16), M.fixed('#5A3E2B'), { pos: [0, 0.015, 0.03], scale: [1, 1, 1.35] })
  )),

  sandals: ({ dims: d, M }) => pair(d, () => group(
    mesh(new THREE.SphereGeometry(0.085, 14, 10), M.role('skin'), { pos: [0, 0.06, 0.03], scale: [0.9, 0.6, 1.3] }),
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 18), M.role('shoes'), { pos: [0, 0.015, 0.03], scale: [1, 1, 1.4] }),
    mesh(new THREE.TorusGeometry(0.075, 0.015, 8, 18, Math.PI), M.role('shoes', { shade: 0.85 }), { pos: [0, 0.035, 0.05] })
  )),

  slippers: ({ dims: d, M }) => pair(d, () => group(
    mesh(new THREE.SphereGeometry(0.11, 18, 12), M.role('shoes', { rough: 1 }), { pos: [0, 0.065, 0.03], scale: [1, 0.62, 1.35] }),
    mesh(new THREE.SphereGeometry(0.04, 12, 10), M.fixed('#FFFFFF', { rough: 1 }), { pos: [0, 0.11, 0.13] })
  ))
}
