import * as THREE from 'three'
import { mesh, group, leafShape } from './helpers.js'

/* Objetos y acompañantes: origen en los pies.
   Los objetos sostenidos se ubican en la mano derecha (dims.arms[0].hand).
   El pajarito se posa en la mano izquierda. Las mascotas se ubican en el suelo, junto al avatar.
   userData.bob = true → el objeto flota suavemente (ver Avatar.update). */

const RED = '#E60012'
const CREAM = '#FFF6E6'

const rightHand = d => d.arms[0].hand

function pet ({ M }, colors, earsBuilder) {
  const body = M.fixed(colors.body, { rough: 0.85 })
  const belly = M.fixed(colors.belly, { rough: 0.85 })
  const dark = M.fixed('#2B2220', { rough: 0.3 })
  const g = group(
    mesh(new THREE.SphereGeometry(0.16, 18, 14), body, { pos: [0, 0.15, 0], scale: [1, 0.95, 1.1] }),
    mesh(new THREE.SphereGeometry(0.1, 14, 10), belly, { pos: [0, 0.14, 0.1], scale: [1, 1.1, 0.6] }),
    mesh(new THREE.SphereGeometry(0.15, 18, 14), body, { pos: [0, 0.37, 0.05] }),
    mesh(new THREE.SphereGeometry(0.06, 12, 10), belly, { pos: [0, 0.33, 0.18], scale: [1.3, 0.9, 0.8] }),
    mesh(new THREE.SphereGeometry(0.018, 8, 6), dark, { pos: [0, 0.35, 0.235] }),
    mesh(new THREE.SphereGeometry(0.02, 8, 6), dark, { pos: [0.06, 0.4, 0.18] }),
    mesh(new THREE.SphereGeometry(0.02, 8, 6), dark, { pos: [-0.06, 0.4, 0.18] }),
    mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 14, Math.PI), body, { pos: [0, 0.18, -0.18], rot: [0, Math.PI / 2, 0.6] })
  )
  earsBuilder(g, body)
  g.position.set(0.62, 0, 0.3)
  g.rotation.y = -0.5
  g.userData.bob = true
  return g
}

export const companionParts = {
  none: () => group(),

  shopbag: ({ dims: d, M }) => {
    const h = rightHand(d)
    const g = group(
      mesh(new THREE.BoxGeometry(0.2, 0.22, 0.09), M.fixed(RED, { rough: 0.7 }), { pos: [0, -0.2, 0] }),
      mesh(new THREE.BoxGeometry(0.12, 0.05, 0.092), M.fixed(CREAM), { pos: [0, -0.18, 0] }),
      mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI), M.fixed(CREAM), { pos: [0, -0.09, 0.02] }),
      mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI), M.fixed(CREAM), { pos: [0, -0.09, -0.02] })
    )
    g.position.copy(h)
    return g
  },

  mug: ({ dims: d, M }) => {
    const h = rightHand(d)
    const g = group(
      mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.13, 18), M.fixed(CREAM, { rough: 0.4 }), {}),
      mesh(new THREE.CircleGeometry(0.058, 18), M.fixed('#6B4226'), { pos: [0, 0.055, 0], rot: [-Math.PI / 2, 0, 0] }),
      mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 14), M.fixed(CREAM, { rough: 0.4 }), { pos: [0.07, 0, 0] }),
      mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.03, 18, 1, true), M.fixed(RED, { side: THREE.DoubleSide }), { pos: [0, -0.02, 0] })
    )
    g.position.copy(h).add(new THREE.Vector3(0.02, 0.06, 0.08))
    return g
  },

  bouquet: ({ dims: d, M }) => {
    const h = rightHand(d)
    const g = group(
      mesh(new THREE.ConeGeometry(0.09, 0.26, 14, 1, true), M.fixed('#F4E8CB', { side: THREE.DoubleSide }), { rot: [Math.PI, 0, 0], pos: [0, 0.02, 0] })
    )
    const colors = ['#E86A5C', '#F2A7B8', '#F6D365', '#FFFFFF']
    ;[[0, 0.16, 0], [0.06, 0.13, 0.03], [-0.06, 0.13, 0.02], [0.01, 0.14, -0.06]].forEach((p, i) => {
      g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), M.fixed(colors[i], { rough: 0.7 }), { pos: p }))
    })
    g.position.copy(h).add(new THREE.Vector3(0, 0.02, 0.06))
    g.rotation.z = -0.25
    return g
  },

  leafumbrella: ({ dims: d, M }) => {
    const h = rightHand(d)
    const topY = d.headTop + 0.28
    const stickLen = topY - h.y
    const g = group(
      mesh(new THREE.CylinderGeometry(0.014, 0.014, stickLen, 8), M.fixed('#8B5E3C'), { pos: [0, stickLen / 2, 0] })
    )
    const leaf = mesh(new THREE.ShapeGeometry(leafShape(0.95, 1.2)), M.fixed('#7DB46C', { side: THREE.DoubleSide, rough: 0.7 }), {
      pos: [0, stickLen + 0.04, 0], rot: [-Math.PI / 2 + 0.15, 0, 0.4]
    })
    leaf.castShadow = true
    g.add(leaf)
    g.add(mesh(new THREE.PlaneGeometry(0.02, 1.0), M.fixed('#5E9A50', { side: THREE.DoubleSide }), {
      pos: [0, stickLen + 0.05, 0], rot: [-Math.PI / 2 + 0.15, 0, 0.4]
    }))
    g.position.copy(h)
    g.rotation.z = 0.12
    return g
  },

  balloon: ({ dims: d, M }) => {
    const h = rightHand(d)
    const height = d.headTop + 0.35 - h.y
    const g = group(
      mesh(new THREE.CylinderGeometry(0.004, 0.004, height, 4), M.fixed('#FFFFFF'), { pos: [0, height / 2, 0] }),
      mesh(new THREE.SphereGeometry(0.2, 22, 16), M.fixed(RED, { rough: 0.3 }), { pos: [0, height + 0.2, 0], scale: [1, 1.15, 1] }),
      mesh(new THREE.ConeGeometry(0.03, 0.04, 8), M.fixed(RED), { pos: [0, height + 0.0, 0] })
    )
    g.position.copy(h)
    g.rotation.z = -0.1
    g.userData.bob = true
    return g
  },

  cat: ctx => pet(ctx, { body: '#F2A65A', belly: '#FFF3E0' }, (g, mat) => {
    ;[-1, 1].forEach(s => g.add(mesh(new THREE.ConeGeometry(0.055, 0.1, 10), mat, { pos: [s * 0.08, 0.5, 0.04], rot: [0, 0, -s * 0.3] })))
  }),

  dog: ctx => pet(ctx, { body: '#C8905E', belly: '#FFF3E0' }, (g) => {
    const ear = ctx.M.fixed('#8B5E3C', { rough: 0.85 })
    ;[-1, 1].forEach(s => g.add(mesh(new THREE.SphereGeometry(0.06, 12, 10), ear, { pos: [s * 0.14, 0.38, 0.02], scale: [0.5, 1.3, 0.9], rot: [0, 0, s * 0.3] })))
  }),

  bird: ({ dims: d, M }) => {
    const yellow = M.fixed('#F6D365', { rough: 0.7 })
    const hand = d.arms[1].hand
    const g = group(
      mesh(new THREE.SphereGeometry(0.07, 14, 12), yellow, { scale: [1, 0.95, 1.15] }),
      mesh(new THREE.SphereGeometry(0.05, 14, 12), yellow, { pos: [0, 0.07, 0.04] }),
      mesh(new THREE.ConeGeometry(0.018, 0.04, 8), M.fixed('#F08A3C'), { pos: [0, 0.07, 0.1], rot: [Math.PI / 2, 0, 0] }),
      mesh(new THREE.SphereGeometry(0.01, 6, 6), M.fixed('#2B2220'), { pos: [0.025, 0.085, 0.08] }),
      mesh(new THREE.SphereGeometry(0.01, 6, 6), M.fixed('#2B2220'), { pos: [-0.025, 0.085, 0.08] }),
      mesh(new THREE.SphereGeometry(0.04, 10, 8), M.fixed('#E8B94A'), { pos: [0.06, 0.0, -0.01], scale: [0.4, 0.8, 1.2] })
    )
    g.position.set(hand.x, hand.y + 0.1, hand.z + 0.02)
    g.rotation.y = -0.3
    g.userData.bob = true
    return g
  }
}
