import * as THREE from 'three'
import gsap from 'gsap'
import { computeDims, fitToModel } from './avatarDims.js'
import { createMaterialKit, KEY_TO_ROLE, roleColor } from './materials.js'
import { createPart, disposeObject } from './PartLoader.js'
import { getOption, BASE_MODELS } from '../data/avatarOptions.js'

/* ==========================================================================
   AVATAR MODULAR
   El avatar es un conjunto de "slots". Cada slot contiene UNA pieza.
   Cambiar una opción reemplaza solo la pieza de su slot; la posición,
   escala, orientación y cámara se conservan.

   parent 'head' → la pieza vive dentro de la cabeza (origen = centro de la cabeza)
   parent 'face' → igual que 'head', pero se escala para encajar en la cabeza
                   del modelo (cabello y rasgos procedurales)
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
    this.nextBlink = 2
  }

  /** Construye el avatar completo (sin transiciones). */
  async build (config) {
    this.config = { ...config }
    this._updateDims()
    await Promise.all(SLOTS.map(s => this._setSlot(s, false)))
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
        jobs.push(this._setSlot(SLOT_BY_KEY[key], this.animated))
        changed.push(SLOT_BY_KEY[key].slot)
      }
    })
    await Promise.all(jobs)
    return changed
  }

  async _rebuildAll () {
    const s = this.bodyGroup.scale
    if (this.animated) await gsap.to(s, { x: 1.08, y: 0.9, z: 1.08, duration: 0.16, ease: 'power2.in' })
    this._updateDims()
    await Promise.all(SLOTS.map(slot => this._setSlot(slot, false)))
    if (this.animated) gsap.to(s, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'elastic.out(1, 0.55)' })
  }

  _updateDims () {
    const dims = computeDims(this.config.bodyType)
    this.dims = BASE_MODELS.head ? fitToModel(dims) : dims
    this.headGroup.position.set(0, this.dims.headY, 0)
    this.faceGroup.scale.fromArray(this.dims.headFit || [1, 1, 1])
  }

  async _setSlot (def, animate) {
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
    if (option.scale) obj.scale.fromArray(option.scale)
    obj.traverse(o => { if (o.isMesh) o.castShadow = true })
    const parent = { head: this.headGroup, face: this.faceGroup }[def.parent] || this.bodyGroup
    const old = this.parts[def.slot]
    this.parts[def.slot] = obj
    parent.add(obj)
    this._applyHides()

    if (old) {
      if (animate) {
        gsap.killTweensOf(old.scale)
        gsap.to(old.scale, {
          x: 0.001, y: 0.001, z: 0.001, duration: 0.22, ease: 'power2.in',
          onComplete: () => { old.removeFromParent(); disposeObject(old) }
        })
      } else {
        old.removeFromParent()
        disposeObject(old)
      }
    }
    if (animate) {
      const target = obj.scale.clone()
      obj.scale.setScalar(0.001)
      gsap.to(obj.scale, { x: target.x, y: target.y, z: target.z, duration: 0.55, delay: 0.12, ease: 'back.out(1.7)' })
    }
  }

  /** Oculta los slots que tapa la ropa elegida (p. ej. el vestido oculta el pantalón). */
  _applyHides () {
    const hidden = new Set()
    SLOTS.forEach(s => {
      const o = s.key && getOption(s.key, this.config[s.key])
      if (o && o.hides) o.hides.forEach(h => hidden.add(h))
    })
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

  /** Centro en coordenadas de mundo de una pieza (para efectos visuales). */
  getSlotCenter (slot) {
    const obj = this.parts[slot]
    const box = new THREE.Box3()
    if (obj) box.setFromObject(obj)
    if (!obj || box.isEmpty()) return new THREE.Vector3(0, this.dims ? this.dims.headY : 1, 0.3)
    return box.getCenter(new THREE.Vector3())
  }

  /** Animación de reposo: respiración, balanceo y parpadeo. */
  update (t) {
    if (!this.animated || !this.dims) return
    this.bodyGroup.position.y = Math.sin(t * 2.1) * 0.006
    this.headGroup.rotation.z = Math.sin(t * 0.9) * 0.035
    this.headGroup.rotation.x = Math.sin(t * 0.7) * 0.02

    if (t > this.nextBlink) {
      this.nextBlink = t + 2.5 + Math.random() * 3
      const eyes = this.parts.eyes
      if (eyes) {
        eyes.traverse(o => {
          if (o.userData.eye) gsap.fromTo(o.scale, { y: 1 }, { y: 0.1, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut' })
        })
      }
    }
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
