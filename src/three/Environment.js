import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SCENE } from '../data/sceneConfig.js'
import { mesh, group, leafShape } from './parts/helpers.js'

/* ==========================================================================
   AMBIENTE: una pequeña isla flotante (diorama).
   Es ambientación: el avatar siempre es el protagonista.
   Para reemplazarlo por modelos propios, completa SCENE.environmentModels
   en src/data/sceneConfig.js. Cada modelo reemplaza su parte procedural.
   ========================================================================== */

const C = SCENE.colors
const mat = (hex, opts = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0, ...opts })

function buildFloor () {
  const top = mesh(new THREE.CylinderGeometry(3, 3, 0.2, 56), mat(C.grass), { pos: [0, -0.1, 0] })
  top.receiveShadow = true
  top.castShadow = false
  const lip = mesh(new THREE.TorusGeometry(3, 0.08, 8, 56), mat(C.grassDark), { pos: [0, -0.02, 0], rot: [Math.PI / 2, 0, 0] })
  lip.castShadow = false
  const earth = mesh(new THREE.CylinderGeometry(2.98, 2.2, 0.8, 56), mat(C.earth), { pos: [0, -0.6, 0] })
  earth.castShadow = false
  const earth2 = mesh(new THREE.ConeGeometry(2.2, 0.9, 40), mat(C.earthDark), { pos: [0, -1.44, 0], rot: [Math.PI, 0, 0] })
  earth2.castShadow = false
  const path = mesh(new THREE.CircleGeometry(1.05, 40), mat(C.path), { pos: [0, 0.004, 0], rot: [-Math.PI / 2, 0, 0] })
  path.receiveShadow = true
  path.castShadow = false
  return group(top, lip, earth, earth2, path)
}

function tree (x, z, s = 1, color = C.foliage[0]) {
  const g = group(
    mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 8), mat(C.trunk), { pos: [0, 0.35, 0] }),
    mesh(new THREE.IcosahedronGeometry(0.55, 1), mat(color, { flatShading: true }), { pos: [0, 1.0, 0], scale: [1, 1.1, 1] }),
    mesh(new THREE.IcosahedronGeometry(0.38, 1), mat(C.foliage[1], { flatShading: true }), { pos: [0.18, 1.45, 0.05] })
  )
  g.position.set(x, 0, z)
  g.scale.setScalar(s)
  return g
}

function bush (x, z, s = 1) {
  const g = group(
    mesh(new THREE.IcosahedronGeometry(0.28, 1), mat(C.foliage[2], { flatShading: true }), { pos: [0, 0.2, 0] }),
    mesh(new THREE.IcosahedronGeometry(0.2, 1), mat(C.foliage[1], { flatShading: true }), { pos: [0.22, 0.14, 0.05] })
  )
  g.position.set(x, 0, z)
  g.scale.setScalar(s)
  return g
}

function flowers (x, z) {
  const g = group()
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7
    const px = Math.cos(a) * 0.14
    const pz = Math.sin(a) * 0.14
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 5), mat('#5E9A50'), { pos: [px, 0.06, pz] }))
    g.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(C.flowers[i % C.flowers.length]), { pos: [px, 0.13, pz] }))
  }
  g.position.set(x, 0, z)
  return g
}

function shelf () {
  const wood = mat(C.wood)
  const woodDark = mat(C.woodDark)
  const g = group(
    mesh(new THREE.BoxGeometry(0.9, 0.05, 0.36), wood, { pos: [0, 0.35, 0] }),
    mesh(new THREE.BoxGeometry(0.9, 0.05, 0.36), wood, { pos: [0, 0.8, 0] }),
    mesh(new THREE.BoxGeometry(0.05, 1.0, 0.36), woodDark, { pos: [-0.45, 0.5, 0] }),
    mesh(new THREE.BoxGeometry(0.05, 1.0, 0.36), woodDark, { pos: [0.45, 0.5, 0] })
  )
  const red = mat(C.boxRed, { roughness: 0.6 })
  const band = mat(C.boxBand)
  const box = (x, y, w, h) => group(
    mesh(new THREE.BoxGeometry(w, h, 0.22), red, { pos: [x, y + h / 2, 0] }),
    mesh(new THREE.BoxGeometry(w + 0.004, h * 0.22, 0.224), band, { pos: [x, y + h * 0.62, 0] })
  )
  g.add(box(-0.22, 0.375, 0.22, 0.26), box(0.08, 0.375, 0.18, 0.2), box(0.3, 0.375, 0.14, 0.3))
  g.add(box(-0.18, 0.825, 0.26, 0.22), box(0.18, 0.825, 0.2, 0.28))
  // Macetita en la parte superior
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 12), mat('#FFF6E6'), { pos: [0.28, 0.885, 0.03] }))
  g.add(mesh(new THREE.IcosahedronGeometry(0.1, 1), mat(C.foliage[0], { flatShading: true }), { pos: [0.28, 1.0, 0.03] }))
  g.position.set(1.75, 0, -0.9)
  g.rotation.y = -0.75
  return g
}

function fence () {
  const g = group()
  const wood = mat('#E9D3AE')
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + 0.55 + i * 0.3
    const r = 2.65
    g.add(mesh(new THREE.BoxGeometry(0.07, 0.38, 0.07), wood, { pos: [Math.cos(a) * r, 0.19, Math.sin(a) * r] }))
  }
  return g
}

function stool () {
  return group(
    mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.08, 24), mat('#FFF6E6'), { pos: [0, 0.34, 0] }),
    mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.32, 10), mat(C.woodDark), { pos: [0, 0.16, 0] })
  )
}

function fallingLeaves () {
  const shape = new THREE.ShapeGeometry(leafShape(0.07, 0.11))
  const leaves = []
  const g = group()
  for (let i = 0; i < 7; i++) {
    const m = mesh(shape, mat(C.foliage[i % 3], { side: THREE.DoubleSide }))
    m.castShadow = false
    m.userData = {
      x: (Math.random() - 0.5) * 4.5,
      z: (Math.random() - 0.5) * 3 - 0.5,
      speed: 0.12 + Math.random() * 0.1,
      phase: Math.random() * 10,
      h: 2.8
    }
    leaves.push(m)
    g.add(m)
  }
  return {
    group: g,
    update (t) {
      leaves.forEach(m => {
        const u = m.userData
        const y = u.h - ((t * u.speed + u.phase) % 1) * u.h
        m.position.set(u.x + Math.sin(t + u.phase) * 0.3, y, u.z)
        m.rotation.set(t * 0.8 + u.phase, t * 0.5, Math.sin(t + u.phase))
      })
    }
  }
}

export function createEnvironment () {
  const root = new THREE.Group()
  root.name = 'environment'

  const floor = buildFloor()
  const plants = group(
    tree(-2.05, -1.25, 1.05, C.foliage[0]),
    tree(-1.2, -2.15, 0.8, C.foliage[2]),
    tree(2.25, 0.9, 0.75, C.foliage[1]),
    bush(-1.9, 0.75, 1.1),
    bush(1.2, -1.95, 0.9),
    flowers(-1.25, 1.35),
    flowers(1.55, 1.55),
    flowers(-2.3, -0.2)
  )
  const decorations = group(shelf(), fence(), stool())
  decorations.children[2].position.set(-1.35, 0, -0.4)
  const leaves = fallingLeaves()
  root.add(leaves.group)
  const loader = new GLTFLoader()

  // Isla final: reemplaza suelo, plantas y decoración. La procedural solo aparece si no carga.
  if (SCENE.islandModel) {
    loader.loadAsync(SCENE.islandModel).then(gltf => {
      gltf.scene.traverse(o => {
        if (!o.isMesh) return
        // El suelo y el pasto plano solo reciben sombra: si también la proyectan, el suelo
        // se sombrea a sí mismo y aparecen franjas en forma de anillos ("shadow acne")
        o.castShadow = !/^(suelo|cesped)/i.test(o.name)
        o.receiveShadow = true
        // Mate: sin el reflejo de luz que dejaba el sol sobre el pasto
        o.material.roughness = 1
        o.material.metalness = 0
      })
      root.add(gltf.scene)
    }).catch(err => {
      console.warn(`[ambiente] No se pudo cargar ${SCENE.islandModel}. Se usa la isla procedural.`, err)
      root.add(floor, plants, decorations)
    })
    return { group: root, update (t) { leaves.update(t) } }
  }

  root.add(floor, plants, decorations)

  // Reemplazo opcional por modelos .glb
  const parts = { floor, plants, decorations }
  Object.entries(SCENE.environmentModels).forEach(([name, url]) => {
    if (!url) return
    loader.loadAsync(url).then(gltf => {
      gltf.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
      root.remove(parts[name])
      root.add(gltf.scene)
    }).catch(err => console.warn(`[ambiente] No se pudo cargar ${url}. Se mantiene el placeholder.`, err))
  })

  return {
    group: root,
    update (t) { leaves.update(t) }
  }
}
