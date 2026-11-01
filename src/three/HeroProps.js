import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { skyTexture } from './materials.js'

/* ==========================================================================
   SOPORTE DE LA PORTADA
   La base de acrílico sale de "Personaje para pagina principal"
   (ver tools/blender/export_soporte.py). El .glb viene ya a la escala del
   avatar y con el origen entre sus pies, así que solo hay que subirla un poco
   para que el personaje quede incrustado en ella.
   Del mismo archivo sale también el llavero, pero en la portada no se usa: la
   cadena tapaba al personaje y lo dejaba descentrado.
   ========================================================================== */

const MODEL = 'models/environment/soporte.glb'

const BASE_MESH = 'Círculo'      // el disco de acrílico, tal como se llama en el .blend
const BASE_LIFT = 0.085          // cuánto sube la base: los pies quedan dentro
/* En el .blend el disco no queda centrado bajo los pies (de perfil el muñeco
   se ve adelantado): se corre hasta el centro de las piernas del avatar. */
const BASE_SHIFT = { x: -0.019, z: 0.0875 }

const GLOSS = { env: 2.2 }    // cuánto refleja el cielo la base de acrílico

const loader = new GLTFLoader()

/** Devuelve el grupo con la base de acrílico listo para añadir a la escena.
    chain: conserva también el llavero (anillos y cadenas) que viene en el mismo archivo;
    se usa en el render del producto del pedido, no en la portada. */
export async function createHeroProps ({ chain = false } = {}) {
  const root = new THREE.Group()
  root.name = 'heroProps'

  const gltf = await loader.loadAsync(MODEL)
  const extra = []
  let found = false
  gltf.scene.traverse(o => {
    if (!o.isMesh) return
    if (!o.name.startsWith(BASE_MESH)) return chain || extra.push(o)   // el llavero solo con chain
    found = true
    o.position.x += BASE_SHIFT.x
    o.position.y += BASE_LIFT
    o.position.z += BASE_SHIFT.z
    o.castShadow = true
    o.receiveShadow = true
    /* Acrílico: translúcido y con brillo */
    const m = o.material
    if (m) {
      m.transparent = true
      m.opacity = 0.42
      m.roughness = 0.02
      m.metalness = 0
      m.depthWrite = false
      /* Plástico brillante: refleja el cielo del escenario y lleva una capa de barniz */
      m.envMap = skyTexture()
      m.envMapIntensity = GLOSS.env
      if ('clearcoat' in m) { m.clearcoat = 1; m.clearcoatRoughness = 0.02 }
      m.needsUpdate = true
    }
  })
  if (!found) throw new Error(`No encuentro la base "${BASE_MESH}" en ${MODEL}`)
  extra.forEach(o => o.removeFromParent())

  root.add(gltf.scene)
  return root
}
