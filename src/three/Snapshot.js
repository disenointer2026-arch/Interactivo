import * as THREE from 'three'
import { Avatar } from './Avatar.js'
import { computeDims } from './avatarDims.js'
import { createMaterialKit } from './materials.js'
import { createPart, disposeObject } from './PartLoader.js'
import { webglAvailable } from './Stage.js'

/* ==========================================================================
   SNAPSHOT: un segundo renderer pequeño que genera imágenes (PNG):
   - miniaturas automáticas de cada opción del panel
   - retratos del avatar (testimonios, pedido, tarjeta coleccionable)
   Si una opción tiene "thumbnail" en avatarOptions.js, se usa esa imagen.
   ========================================================================== */

let renderer = null
let scene = null
let camera = null
const cache = new Map()

function setup () {
  if (renderer) return true
  if (!webglAvailable()) return false
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setClearColor(0x000000, 0)
  scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight('#FFF4E0', '#C9D9B8', 1.8))
  const key = new THREE.DirectionalLight('#FFE6C2', 2.2)
  key.position.set(2, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight('#D6E9FF', 0.8)
  rim.position.set(-3, 2, -3)
  scene.add(rim)
  camera = new THREE.PerspectiveCamera(26, 1, 0.05, 50)
  return true
}

function frameBox (box, { angle = 0.35, elevation = 0.12, pad = 1.25 } = {}) {
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  // De perfil se ve la profundidad (z) en lugar del ancho (x): se usa la que quede de frente
  const side = Math.abs(Math.sin(angle))
  const across = size.x * (1 - side) + size.z * side
  const radius = Math.max(across, size.y, size.z * 0.8) * 0.5
  const dist = (radius * pad) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  const dir = new THREE.Vector3(Math.sin(angle), elevation, Math.cos(angle)).normalize()
  camera.position.copy(center).addScaledVector(dir, dist)
  camera.near = dist / 20
  camera.far = dist * 10
  camera.updateProjectionMatrix()
  camera.lookAt(center)
}

function capture (obj, width, height, frame) {
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  scene.add(obj)
  frame()
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  scene.remove(obj)
  return url
}

/** Retrato del avatar completo o del busto. framing: 'full' | 'bust' | 'portrait'
    angle: giro de la cámara alrededor del avatar (0 = de frente); elevation: altura de la mirada. */
export async function renderAvatar (config, { width = 512, height = 512, framing = 'full', angle, elevation } = {}) {
  if (!setup()) return null
  const bust = framing === 'bust'
  angle = angle ?? (bust ? 0.21 : 0.35)
  elevation = elevation ?? (bust ? 0.05 : 0.14)
  const key = `avatar:${framing}:${width}x${height}:${angle}:${elevation}:${JSON.stringify(config)}`
  if (cache.has(key)) return cache.get(key)
  const avatar = new Avatar({ animated: false })
  await avatar.build(config)
  const d = avatar.dims
  const url = capture(avatar.root, width, height, () => {
    let box
    if (bust) {
      box = new THREE.Box3(
        new THREE.Vector3(-d.headR * 1.1, d.headY - d.headR * 1.25, -d.headR),
        new THREE.Vector3(d.headR * 1.1, d.headY + d.headR * 1.05, d.headR)
      )
      // Incluye todo el cabello (moños y colas sobresalen por detrás de la cabeza)
      box.union(new THREE.Box3().setFromObject(avatar.headGroup))
      frameBox(box, { angle, elevation, pad: 1.05 })
    } else {
      box = new THREE.Box3().setFromObject(avatar.root)
      frameBox(box, { angle, elevation, pad: framing === 'portrait' ? 1.02 : 1.12 })
    }
  })
  avatar.dispose()
  cache.set(key, url)
  return url
}

/** Miniatura de una pieza suelta. Devuelve null si la pieza está vacía ("Nada"). */
export async function renderPart (slot, option, config, size = 160) {
  if (!setup()) return null
  const key = `part:${slot}:${option.id}:${config.bodyType}:${config.shirtColor}:${config.pantsColor}:${config.shoesColor}:${config.skin}`
  if (cache.has(key)) return cache.get(key)
  const dims = computeDims(config.bodyType)
  const obj = await createPart(slot, option, { dims, M: createMaterialKit(config), config })
  const box = new THREE.Box3().setFromObject(obj)
  if (box.isEmpty()) { disposeObject(obj); cache.set(key, null); return null }
  const url = capture(obj, size, size, () => frameBox(box, { angle: 0.45, elevation: 0.2, pad: 1.15 }))
  disposeObject(obj)
  cache.set(key, url)
  return url
}
