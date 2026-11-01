import * as THREE from 'three'
import { Avatar } from './Avatar.js'
import { computeDims } from './avatarDims.js'
import { createMaterialKit, skyTexture } from './materials.js'
import { createPart, disposeObject } from './PartLoader.js'
import { webglAvailable } from './Stage.js'
import { createHeroProps } from './HeroProps.js'
import { getOption } from '../data/avatarOptions.js'
import { SCENE } from '../data/sceneConfig.js'

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
  // Mismos colores que el escenario (cálidos), con intensidades propias para los retratos
  const L = SCENE.lights
  scene.add(new THREE.HemisphereLight(L.sky, L.ground, 1.8))
  const key = new THREE.DirectionalLight(L.key, 2.2)
  key.position.set(2, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(L.fill, 0.8)
  rim.position.set(-3, 2, -3)
  scene.add(rim)
  camera = new THREE.PerspectiveCamera(26, 1, 0.05, 50)
  return true
}

/** Caja real de un objeto: con "precise", las prendas con huesos se miden ya deformadas
    (si no, la caja sale donde estaría la malla sin el esqueleto) */
function boxOf (obj) {
  obj.updateMatrixWorld(true)
  return new THREE.Box3().setFromObject(obj, true)
}

function frameBox (box, { angle = 0.35, elevation = 0.12, pad = 1.25 } = {}) {
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  // De perfil se ve la profundidad (z) en lugar del ancho (x): se usa la que quede de frente
  const side = Math.abs(Math.sin(angle))
  const across = size.x * (1 - side) + size.z * side
  // Con una imagen más estrecha que alta, lo que manda es el ancho (aspect = ancho / alto)
  const radius = Math.max(Math.max(size.y, size.z * 0.8) * 0.5, (across * 0.5) / Math.min(1, camera.aspect))
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
export async function renderAvatar (config, { width = 512, height = 512, framing = 'full', angle, elevation, pose } = {}) {
  if (!setup()) return null
  const bust = framing === 'bust'
  angle = angle ?? (bust ? 0.21 : 0.35)
  elevation = elevation ?? (bust ? 0.05 : 0.14)
  const key = `avatar:${framing}:${width}x${height}:${angle}:${elevation}:${pose}:${JSON.stringify(config)}`
  if (cache.has(key)) return cache.get(key)
  const avatar = new Avatar({ animated: false })
  await avatar.build(config)
  if (pose) avatar.setPose(pose)
  const d = avatar.dims
  const url = capture(avatar.root, width, height, () => {
    let box
    if (bust) {
      box = new THREE.Box3(
        new THREE.Vector3(-d.headR * 1.1, d.headY - d.headR * 1.25, -d.headR),
        new THREE.Vector3(d.headR * 1.1, d.headY + d.headR * 1.05, d.headR)
      )
      // Incluye todo el cabello (moños y colas sobresalen por detrás de la cabeza)
      box.union(boxOf(avatar.headGroup))
      frameBox(box, { angle, elevation, pad: 1.05 })
    } else {
      box = boxOf(avatar.root)
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
  const box = boxOf(obj)
  if (box.isEmpty()) { disposeObject(obj); cache.set(key, null); return null }
  const url = capture(obj, size, size, () => frameBox(box, { angle: 0.45, elevation: 0.2, pad: 1.15 }))
  disposeObject(obj)
  cache.set(key, url)
  return url
}

/* ---------- Render del producto (figura + base + cadena + charm) ----------
   El charm cuelga del extremo de la cadena que se abre hacia la derecha (a la
   izquierda del personaje), a la altura de la cabeza, sin tocarla. */
const CHARM_HANG = { x: 0.42, y: 2.19, z: -0.2, rotY: -0.35 }
/* El llavero del archivo del equipo trae el material "metal" sin rugosidad (queda opaco
   y oscuro): se le da el brillo de un metal pulido reflejando el cielo del escenario */
const METAL = { roughness: 0.28, env: 1.25 }

function radialTexture (stops) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  stops.forEach(([at, color]) => grad.addColorStop(at, color))
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Suelo de estudio: un disco gris que se desvanece hacia el horizonte y, encima,
    la sombra de contacto de la base. y = altura del suelo. */
function studioFloor (y) {
  const group = new THREE.Group()
  const floorTex = radialTexture([[0, 'rgba(176,176,176,1)'], [0.4, 'rgba(160,160,160,.9)'], [0.75, 'rgba(130,130,130,.35)'], [1, 'rgba(120,120,120,0)']])
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = y
  const shadowTex = radialTexture([[0, 'rgba(0,0,0,.6)'], [0.6, 'rgba(0,0,0,.28)'], [1, 'rgba(0,0,0,0)']])
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = y + 0.002
  floor.renderOrder = -2
  shadow.renderOrder = -1
  group.add(floor, shadow)
  return group
}

export async function renderProduct (config, { width = 480, height = 480 } = {}) {
  if (!setup()) return null
  const key = `product:${width}x${height}:${JSON.stringify(config)}`
  if (cache.has(key)) return cache.get(key)
  const avatar = new Avatar({ animated: false })
  await avatar.build({ ...config, companion: 'none' })
  const group = new THREE.Group()
  group.add(avatar.root)
  const props = await createHeroProps({ chain: true }).catch(() => null)
  if (props) {
    props.traverse(o => {
      const m = o.isMesh && o.material
      if (!m) return
      // El acrílico trae "transmisión" (se dibuja antes que lo transparente y taparía
      // el suelo por encima de él): sin ella se ordena bien con el suelo y la sombra
      if (m.transparent) { m.transmission = 0; m.needsUpdate = true; return }
      m.metalness = 1
      m.roughness = METAL.roughness
      m.envMap = skyTexture()
      m.envMapIntensity = METAL.env
      m.needsUpdate = true
    })
    group.add(props)
  }
  let charm = null
  const option = config.companion && config.companion !== 'none' ? getOption('companion', config.companion) : null
  if (option && option.model) {
    charm = await createPart('companion', option, { dims: avatar.dims, M: createMaterialKit(config), config })
    const box = boxOf(charm)
    if (!box.isEmpty()) {
      charm.position.set(CHARM_HANG.x, CHARM_HANG.y - box.max.y, CHARM_HANG.z)
      charm.rotation.y = CHARM_HANG.rotY
      group.add(charm)
    }
  }
  // El suelo (más grande que el encuadre, para que su borde no se vea) queda a la altura de la parte baja de la base de acrílico
  const floorY = props ? boxOf(props).min.y : 0
  const floor = studioFloor(floorY)
  group.add(floor)
  const url = capture(group, width, height, () => {
    // Se encuadra solo la figura (sin el disco de suelo), de frente y con la cámara un poco elevada
    const box = new THREE.Box3()
    ;[avatar.root, props, charm].filter(Boolean).forEach(o => box.union(boxOf(o)))
    frameBox(box, { angle: 0, elevation: 0.16, pad: 1.12 })
  })
  floor.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.map.dispose(); o.material.dispose() } })
  if (charm) disposeObject(charm)
  avatar.dispose()
  cache.set(key, url)
  return url
}
