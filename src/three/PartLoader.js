import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { BUILDERS } from './parts/index.js'
import { ROLE_TO_KEY, PLASTIC, skyTexture } from './materials.js'

/* Crea la pieza 3D de una opción:
   1. Si la opción tiene "model" (.glb/.gltf), lo carga con GLTFLoader.
   2. Si no tiene modelo, o si la carga falla, usa el placeholder procedural.
   Así el prototipo nunca se detiene por falta de modelos. */

const loader = new GLTFLoader()
const cache = new Map()

function loadGLTF (url) {
  return loader.loadAsync(url).then(gltf => {
    gltf.scene.traverse(o => {
      if (!o.isMesh || !o.material) return
      o.material.envMap = skyTexture()
      o.material.envMapIntensity = PLASTIC.env
      // La rugosidad horneada es casi toda 1 (mate): este factor deja un brillo
      // suave en toda la pieza y los puntitos quedan como destellos
      if (o.material.roughnessMap) o.material.roughness = PLASTIC.roughness
    })
    return gltf
  })
}

export async function createPart (slot, option, ctx) {
  if (option && option.model) {
    try {
      return await loadModel(option.model, ctx)
    } catch (err) {
      console.warn(`[avatar] No se pudo cargar ${option.model}. Se usa el placeholder.`, err)
    }
  }
  const lib = BUILDERS[slot] || {}
  const key = (option && (option.builder || option.id)) || 'default'
  const build = lib[key] || lib.default
  return build ? build(ctx) : new THREE.Group()
}

async function loadModel (url, ctx) {
  if (!cache.has(url)) cache.set(url, loadGLTF(url))
  const gltf = await cache.get(url)
  const obj = gltf.scene.clone(true)
  obj.traverse(o => {
    if (!o.isMesh) return
    o.castShadow = true
    o.userData.fromGLB = true
    const name = (o.material && o.material.name ? o.material.name : '').toLowerCase()
    const role = Object.keys(ROLE_TO_KEY).find(r => name.includes(r))
    if (role) {
      o.material = o.material.clone()
      o.material.color = new THREE.Color(ctx.config[ROLE_TO_KEY[role]])
      o.material.userData.role = role
      o.material.userData.shade = 1
    }
  })
  return obj
}

/** Libera memoria de GPU de una pieza que ya no se usa. */
export function disposeObject (obj) {
  obj.traverse(o => {
    if (!o.isMesh || o.userData.fromGLB) return
    o.geometry && o.geometry.dispose()
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    mats.forEach(m => {
      if (!m) return
      m.map && m.map.dispose()
      m.dispose()
    })
  })
}
