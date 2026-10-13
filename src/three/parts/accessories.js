import * as THREE from 'three'
import { mesh, group, placeOnHead, leafShape } from './helpers.js'

/* Accesorios de cabeza y cara: origen en el centro de la cabeza.
   Accesorios de cuello/torso: origen en los pies. */

const RED = '#E60012'
const CREAM = '#FFF6E6'

export const headAccParts = {
  none: () => group(),

  cap: ({ dims: d, M }) => {
    const red = M.fixed(RED, { rough: 0.7 })
    const R = d.headR * 1.1
    return group(
      mesh(new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), red, {
        pos: [0, 0.1, -0.02], scale: [1, 0.78, 1]
      }),
      mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 28, 1, false, -Math.PI / 2, Math.PI), red, {
        pos: [0, 0.14, 0.33], rot: [0.16, 0, 0], scale: [1, 1, 0.95]
      }),
      mesh(new THREE.SphereGeometry(0.04, 12, 8), M.fixed(CREAM), { pos: [0, 0.1 + R * 0.78, -0.02] })
    )
  },

  strawhat: ({ dims: d, M }) => {
    const straw = M.fixed('#E8C77E', { rough: 0.95 })
    return group(
      mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.26, 28), straw, { pos: [0, 0.48, 0] }),
      mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 28), straw, { pos: [0, 0.6, 0], scale: [0.98, 1, 0.98] }),
      mesh(new THREE.CylinderGeometry(0.76, 0.78, 0.03, 36), straw, { pos: [0, 0.36, 0], rot: [0.08, 0, 0] }),
      mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.06, 28, 1, true), M.fixed(RED, { side: THREE.DoubleSide }), { pos: [0, 0.4, 0] })
    )
  },

  beanie: ({ dims: d, M }) => {
    const knit = M.fixed('#F2B84B', { rough: 1 })
    const R = d.headR * 1.1
    return group(
      mesh(new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), knit, { pos: [0, 0.12, 0], scale: [1, 0.85, 1] }),
      mesh(new THREE.TorusGeometry(R * 0.98, 0.06, 10, 32), M.fixed('#E3A437', { rough: 1 }), { pos: [0, 0.14, 0], rot: [Math.PI / 2, 0, 0] }),
      mesh(new THREE.SphereGeometry(0.1, 14, 10), M.fixed(CREAM, { rough: 1 }), { pos: [0, 0.12 + R * 0.85 + 0.05, 0] })
    )
  },

  headband: ({ dims: d, M }) => {
    const pink = M.fixed('#F2A7B8', { rough: 0.6 })
    const g = group(
      mesh(new THREE.TorusGeometry(d.headR * 1.04, 0.028, 8, 36, Math.PI), pink, {
        pos: [0, 0.02, 0.05], scale: [d.headScale[0] * 1.02, d.headScale[1] * 1.04, 1], rot: [-0.25, 0, 0]
      })
    )
    const bow = group(
      mesh(new THREE.ConeGeometry(0.08, 0.14, 12), M.fixed(RED), { rot: [0, 0, Math.PI / 2], pos: [0.07, 0, 0] }),
      mesh(new THREE.ConeGeometry(0.08, 0.14, 12), M.fixed(RED), { rot: [0, 0, -Math.PI / 2], pos: [-0.07, 0, 0] }),
      mesh(new THREE.SphereGeometry(0.035, 10, 8), M.fixed(RED), {})
    )
    bow.position.set(0.28, 0.4, 0.12)
    bow.rotation.set(0, 0, -0.5)
    g.add(bow)
    return g
  },

  headphones: ({ dims: d, M }) => {
    const mint = M.fixed('#9ACB8A', { rough: 0.5 })
    const cushion = M.fixed(CREAM, { rough: 0.9 })
    const g = group(
      mesh(new THREE.TorusGeometry(d.headR * 1.1, 0.035, 10, 36, Math.PI), mint, { pos: [0, 0.02, 0], scale: [1.05, 0.95, 1] })
    )
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 20), mint, { pos: [s * (d.earX + 0.05), -0.02, 0], rot: [0, 0, Math.PI / 2] }))
      g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 20), cushion, { pos: [s * (d.earX + 0.0), -0.02, 0], rot: [0, 0, Math.PI / 2] }))
    })
    return g
  },

  leafcrown: ({ dims: d, M }) => {
    const g = group(
      mesh(new THREE.TorusGeometry(d.headR * 0.86, 0.02, 8, 36), M.fixed('#8B5E3C'), { pos: [0, 0.33, 0], rot: [Math.PI / 2, 0, 0] })
    )
    const shape = new THREE.ShapeGeometry(leafShape(0.12, 0.2))
    const greens = ['#7DB46C', '#8CC37A', '#6BA35E']
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const r = d.headR * 0.88
      const leaf = mesh(shape, M.fixed(greens[i % 3], { side: THREE.DoubleSide }), {
        pos: [Math.sin(a) * r, 0.38, Math.cos(a) * r]
      })
      leaf.rotation.set(-0.35, a, (i % 2 ? 0.3 : -0.3))
      g.add(leaf)
    }
    return g
  },

  flower: ({ dims: d, M }) => {
    const flower = group(mesh(new THREE.SphereGeometry(0.045, 12, 10), M.fixed('#F6D365'), { scale: [1, 1, 0.6] }))
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      flower.add(mesh(new THREE.SphereGeometry(0.055, 12, 10), M.fixed('#FFFFFF', { rough: 0.6 }), {
        pos: [Math.cos(a) * 0.07, Math.sin(a) * 0.07, -0.01], scale: [1, 1, 0.45]
      }))
    }
    return placeOnHead(flower, d, 0.3, 0.26, 0.03)
  }
}

export const faceAccParts = {
  none: () => group(),

  roundglasses: ({ dims: d, M }) => {
    const frame = M.fixed('#5A3E2B', { rough: 0.4 })
    const g = group()
    ;[-1, 1].forEach(s => {
      g.add(placeOnHead(mesh(new THREE.TorusGeometry(0.095, 0.013, 8, 28), frame), d, s * 0.17, 0.0, 0.05))
    })
    g.add(placeOnHead(group(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), frame, { rot: [0, 0, Math.PI / 2] })), d, 0, 0.02, 0.07))
    return g
  },

  sunglasses: ({ dims: d, M }) => {
    const lens = M.fixed('#2A2A30', { rough: 0.15, metal: 0.2 })
    const frame = M.fixed(RED, { rough: 0.4 })
    const g = group()
    ;[-1, 1].forEach(s => {
      const l = group(
        mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.015, 24), lens, { rot: [Math.PI / 2, 0, 0], scale: [1.1, 1, 0.9] }),
        mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 24), frame, { scale: [1.1, 0.9, 1] })
      )
      g.add(placeOnHead(l, d, s * 0.17, 0.0, 0.05))
    })
    g.add(placeOnHead(group(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), frame, { rot: [0, 0, Math.PI / 2] })), d, 0, 0.02, 0.07))
    return g
  },

  blush: ({ dims: d, M }) => {
    const pink = M.fixed('#F4978E', { opacity: 0.7, rough: 1 })
    const g = group()
    ;[-1, 1].forEach(s => {
      g.add(placeOnHead(mesh(new THREE.CircleGeometry(0.06, 20), pink, { scale: [1.3, 0.8, 1] }), d, s * 0.25, -0.13, 0.006))
    })
    return g
  },

  nosering: ({ dims: d, M }) => group(
    placeOnHead(mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 16), M.fixed('#D9D9D9', { metal: 0.9, rough: 0.25 }), { rot: [0, 1.2, 0] }), d, 0.045, -0.12, 0.03)
  ),

  earrings: ({ dims: d, M }) => {
    const gold = M.fixed('#F2C14E', { metal: 0.8, rough: 0.3 })
    const g = group()
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 16), gold, { pos: [s * (d.earX + 0.02), d.earY - 0.12, 0.02], rot: [0, Math.PI / 2, 0] }))
    })
    return g
  },

  bandaid: ({ dims: d, M }) => group(
    placeOnHead(mesh(new THREE.BoxGeometry(0.12, 0.04, 0.01), M.fixed('#F2D3A8', { rough: 1 }), { rot: [0, 0, 0.4] }), d, -0.26, -0.1, 0.008)
  )
}

export const neckAccParts = {
  none: () => group(),

  scarf: ({ dims: d, M }) => {
    const red = M.fixed(RED, { rough: 0.95 })
    return group(
      mesh(new THREE.TorusGeometry(d.torsoR * 0.72, 0.075, 12, 28), red, { pos: [0, d.torsoTop - 0.06, 0], rot: [Math.PI / 2, 0, 0] }),
      mesh(new THREE.BoxGeometry(0.1, 0.24, 0.05), red, { pos: [d.torsoR * 0.45, d.torsoTop - 0.2, d.torsoR * 0.85], rot: [0.15, 0, 0.12] }),
      mesh(new THREE.BoxGeometry(0.1, 0.02, 0.055), M.fixed(CREAM, { rough: 0.95 }), { pos: [d.torsoR * 0.46, d.torsoTop - 0.28, d.torsoR * 0.86], rot: [0.15, 0, 0.12] })
    )
  },

  necklace: ({ dims: d, M }) => {
    const gold = M.fixed('#F2C14E', { metal: 0.7, rough: 0.35 })
    const z = d.torsoR * 1.07 * 0.88
    return group(
      mesh(new THREE.TorusGeometry(d.torsoR * 0.62, 0.008, 6, 32), gold, { pos: [0, d.torsoTop - 0.08, 0.03], rot: [Math.PI / 2 - 0.5, 0, 0] }),
      mesh(new THREE.ShapeGeometry(leafShape(0.07, 0.1)), M.fixed('#7DB46C', { side: THREE.DoubleSide }), { pos: [0, d.torsoTop - 0.2, z + 0.01] })
    )
  },

  bowtie: ({ dims: d, M }) => {
    const red = M.fixed(RED, { rough: 0.6 })
    const z = d.torsoR * 0.92
    return group(
      mesh(new THREE.ConeGeometry(0.06, 0.1, 10), red, { pos: [0.05, d.torsoTop - 0.1, z], rot: [0, 0, Math.PI / 2] }),
      mesh(new THREE.ConeGeometry(0.06, 0.1, 10), red, { pos: [-0.05, d.torsoTop - 0.1, z], rot: [0, 0, -Math.PI / 2] }),
      mesh(new THREE.SphereGeometry(0.03, 10, 8), red, { pos: [0, d.torsoTop - 0.1, z + 0.01] })
    )
  },

  crossbag: ({ dims: d, M }) => {
    const leather = M.fixed('#9E6B43', { rough: 0.6 })
    const R = d.torsoR * 1.18
    return group(
      mesh(new THREE.TorusGeometry(R, 0.018, 6, 36), leather, { pos: [0, d.torsoY + 0.02, 0], rot: [Math.PI / 2, 0.85, 0], scale: [1, 0.88, 1.9] }),
      mesh(new THREE.BoxGeometry(0.2, 0.15, 0.07), leather, { pos: [-d.torsoR * 0.95, d.hipY + 0.02, d.torsoR * 0.55], rot: [0, -0.6, 0] }),
      mesh(new THREE.BoxGeometry(0.2, 0.05, 0.075), M.fixed('#7E5234'), { pos: [-d.torsoR * 0.95, d.hipY + 0.07, d.torsoR * 0.56], rot: [0, -0.6, 0] })
    )
  },

  backpack: ({ dims: d, M }) => {
    const mint = M.fixed('#9ACB8A', { rough: 0.8 })
    const g = group(
      mesh(new THREE.CapsuleGeometry(d.torsoR * 0.7, d.torsoH * 0.6 + 0.1, 6, 16), mint, {
        pos: [0, d.torsoY + 0.02, -d.torsoR * 1.05], scale: [1, 1, 0.55]
      }),
      mesh(new THREE.BoxGeometry(d.torsoR * 0.9, 0.12, 0.05), M.fixed('#86B876'), { pos: [0, d.torsoY - 0.08, -d.torsoR * 1.35] })
    )
    ;[-1, 1].forEach(s => {
      g.add(mesh(new THREE.TorusGeometry(d.torsoR * 0.55, 0.018, 6, 20, Math.PI), mint, {
        pos: [s * d.torsoR * 0.5, d.torsoY + 0.05, -0.02], rot: [0, Math.PI / 2, 0], scale: [1.9, 1.1, 1]
      }))
    })
    return g
  }
}
