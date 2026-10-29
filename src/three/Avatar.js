import * as THREE from 'three'
import gsap from 'gsap'
import { computeDims, fitToModel } from './avatarDims.js'
import { createMaterialKit, KEY_TO_ROLE, roleColor } from './materials.js'
import { createPart, disposeObject } from './PartLoader.js'
import { getOption, hiddenKeys, BASE_MODELS } from '../data/avatarOptions.js'

/* ==========================================================================
   AVATAR MODULAR
   El avatar es un conjunto de "slots". Cada slot contiene UNA pieza.
   Cambiar una opción reemplaza solo la pieza de su slot, al instante (como en el
   juego); la posición, escala, orientación y cámara se conservan.

   parent 'head' → la pieza vive dentro de la cabeza (origen = centro de la cabeza)
   parent 'face' → igual que 'head', pero se escala para encajar en la cabeza
                   del modelo (cabello y rasgos procedurales; las piezas .glb ya
                   vienen a escala y van directo en la cabeza)
   parent 'body' → la pieza vive en el cuerpo (origen = pies)
   ========================================================================== */
export const SLOTS = [
  { slot: 'body', key: 'bodyType', parent: 'body' },
  { slot: 'head', key: null, parent: 'head' },
  { slot: 'ears', key: 'ears', parent: 'head' },
  { slot: 'hair', key: 'hair', parent: 'face' },
  { slot: 'eyes', key: 'eyes', parent: 'face' },
  { slot: 'nose', key: 'nose', parent: 'face' },
  { slot: 'mouth', key: 'mouth', parent: 'face' },
  { slot: 'shirt', key: 'shirt', parent: 'body' },
  { slot: 'pants', key: 'pants', parent: 'body' },
  { slot: 'shoes', key: 'shoes', parent: 'body' },
  { slot: 'accHead', key: 'accHead', parent: 'face' },
  { slot: 'accFace', key: 'accFace', parent: 'face' },
  { slot: 'accNeck', key: 'accNeck', parent: 'body' },
  { slot: 'companion', key: 'companion', parent: 'body' }
]

/* Recorte del pelo bajo los sombreros: el material descarta lo que está por encima de
   la altura "hairCut" (en el espacio de la cabeza, donde vive el modelo del pelo) */
function hairCutUniform (mat) {
  if (mat.userData.hairCut) return mat.userData.hairCut
  const cut = { value: 1e6 }
  mat.onBeforeCompile = shader => {
    shader.uniforms.hairCut = cut
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vHairY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHairY = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float hairCut;\nvarying float vHairY;')
      .replace('void main() {', 'void main() {\n  if (vHairY > hairCut) discard;')
  }
  mat.userData.hairCut = cut
  return cut
}

export const SLOT_BY_KEY = Object.fromEntries(SLOTS.filter(s => s.key).map(s => [s.key, s]))

export class Avatar {
  constructor ({ animated = true } = {}) {
    this.animated = animated
    this.root = new THREE.Group()
    this.root.name = 'avatar'
    this.bodyGroup = new THREE.Group()
    this.headGroup = new THREE.Group()
    this.faceGroup = new THREE.Group()
    this.root.add(this.bodyGroup)
    this.bodyGroup.add(this.headGroup)
    this.headGroup.add(this.faceGroup)
    this.parts = {}
    this.tokens = {}
    this.config = null
    this.dims = null
  }

  /** Construye el avatar completo (sin transiciones). */
  async build (config) {
    this.config = { ...config }
    this._updateDims()
    await Promise.all(SLOTS.map(s => this._setSlot(s)))
    return this
  }

  /** Aplica una nueva configuración y cambia solo lo necesario. Devuelve los slots que cambiaron. */
  async apply (next) {
    const prev = this.config
    this.config = { ...next }
    if (!prev) { await this.build(next); return ['*'] }

    if (prev.bodyType !== next.bodyType) {
      await this._rebuildAll()
      return ['body']
    }

    const changed = []
    const jobs = []
    Object.keys(next).forEach(key => {
      if (prev[key] === next[key]) return
      const role = KEY_TO_ROLE[key]
      if (role) {
        this._tweenRole(role, next[key])
        changed.push(key)
      } else if (SLOT_BY_KEY[key]) {
        jobs.push(this._setSlot(SLOT_BY_KEY[key]))
        changed.push(SLOT_BY_KEY[key].slot)
      }
    })
    await Promise.all(jobs)
    // Los accesorios que dependen del peinado se reacomodan al cambiarlo
    if (prev.hair !== next.hair) Object.values(this.parts).forEach(p => this._applyPlace(p))
    return changed
  }

  async _rebuildAll () {
    const s = this.bodyGroup.scale
    if (this.animated) await gsap.to(s, { x: 1.08, y: 0.9, z: 1.08, duration: 0.16, ease: 'power2.in' })
    this._updateDims()
    await Promise.all(SLOTS.map(slot => this._setSlot(slot)))
    if (this.animated) gsap.to(s, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.55)' })
  }

  _updateDims () {
    const dims = computeDims(this.config.bodyType)
    this.dims = BASE_MODELS.head ? fitToModel(dims) : dims
    this.headGroup.position.set(0, this.dims.headY, 0)
    this.faceGroup.scale.fromArray(this.dims.headFit || [1, 1, 1])
  }

  async _setSlot (def) {
    const token = (this.tokens[def.slot] || 0) + 1
    this.tokens[def.slot] = token

    const id = def.key ? this.config[def.key] : 'default'
    let option = (def.key && getOption(def.key, id)) || { id }
    // Piezas fijas del personaje modelado (null = slot vacío, p. ej. orejas)
    if (def.slot in BASE_MODELS) option = BASE_MODELS[def.slot] ? { id: 'base', model: BASE_MODELS[def.slot] } : { id: 'none' }
    const ctx = { dims: this.dims, M: createMaterialKit(this.config), config: this.config }
    const obj = await createPart(def.slot, option, ctx)

    // Si llegó otra selección mientras cargaba, descartamos esta
    if (this.tokens[def.slot] !== token) { disposeObject(obj); return }

    obj.name = def.slot
    obj.userData.place = option.place
    this._applyPlace(obj)
    let fromModel = false
    obj.traverse(o => {
      if (o.isMesh) o.castShadow = true
      if (o.userData.fromGLB) fromModel = true
      // Color fijo de la opción (p. ej. la nariz naranja): ya no sigue a su rol
      if (o.isMesh && option.color) {
        o.material = o.material.clone()
        o.material.color.set(option.color)
        delete o.material.userData.role
      }
    })
    const parentName = def.parent === 'face' && fromModel ? 'head' : def.parent
    const parent = { head: this.headGroup, face: this.faceGroup }[parentName] || this.bodyGroup
    const old = this.parts[def.slot]
    this.parts[def.slot] = obj
    parent.add(obj)
    this._applyHides()
    this._applyHairCut()

    if (old) {
      old.removeFromParent()
      disposeObject(old)
    }
  }

  /** Ubicación propia de la opción (p. ej. los llaveros, en el suelo detrás del personaje).
      place.byHair ajusta la pieza según el peinado (la balaca se inclina con el afro). */
  _applyPlace (obj) {
    const base = obj.userData.place
    if (!base) return
    const place = { ...base, ...(base.byHair && base.byHair[this.config.hair]) }
    obj.position.fromArray(place.position || [0, 0, 0])
    obj.rotation.fromArray(place.rotation || [0, 0, 0])
    const s = place.scale || 1
    if (Array.isArray(s)) obj.scale.fromArray(s)
    else obj.scale.setScalar(s)
  }

  /** Con un sombrero puesto, oculta el pelo que queda por encima de su borde. */
  _applyHairCut () {
    const hair = this.parts.hair
    if (!hair) return
    const acc = getOption('accHead', this.config.accHead)
    const y = acc && acc.hairCut !== undefined ? acc.hairCut : 1e6
    hair.traverse(o => {
      if (!o.isMesh || !o.userData.fromGLB) return
      hairCutUniform(o.material).value = y
    })
  }

  /** Oculta los slots que tapa la ropa elegida (p. ej. el vestido oculta el pantalón). */
  _applyHides () {
    const hidden = hiddenKeys(this.config)
    Object.entries(this.parts).forEach(([slot, obj]) => { obj.visible = !hidden.has(slot) })
  }

  _tweenRole (role, hex) {
    this.root.traverse(o => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach(m => {
        if (!m || !m.userData || m.userData.role !== role) return
        const c = roleColor(hex, m.userData.shade || 1)
        if (this.animated) gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration: 0.45, ease: 'power2.out' })
        else m.color.copy(c)
      })
    })
  }

  /** Animación de reposo: respiración y balanceo (sin parpadeo: los ojos son mapas UV). */
  update (t) {
    if (!this.animated || !this.dims) return
    this.bodyGroup.position.y = Math.sin(t * 2.1) * 0.006
    this.headGroup.rotation.z = Math.sin(t * 0.9) * 0.035
    this.headGroup.rotation.x = Math.sin(t * 0.7) * 0.02

    const comp = this.parts.companion
    if (comp && comp.userData.bob) {
      comp.userData.baseY = comp.userData.baseY ?? comp.position.y
      comp.position.y = comp.userData.baseY + Math.sin(t * 2.4) * 0.015
    }
  }

  dispose () {
    Object.values(this.parts).forEach(p => { p.removeFromParent(); disposeObject(p) })
    this.parts = {}
  }
}
