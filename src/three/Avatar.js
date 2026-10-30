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

const _q = new THREE.Quaternion()

/* Poses para retratos: [nod, tilt] por hueso (nombres sin punto, como quedan en el .glb).
   nod gira alrededor del eje x (negativo = hacia adelante en brazos y piernas, hacia atrás
   en la cabeza); tilt alrededor del eje z (positivo sube el brazo izquierdo, el de la
   derecha vista de frente). "retrato": de pie y relajada, como el arte del juego: brazos
   un poco hacia adelante, cabeza ladeada y un pie apenas adelantado (deforma poco la ropa) */
const POSES = {
  // Al pulsar "Finalizar avatar": saluda doblando solo el antebrazo (el hombro casi no se
  // mueve, así la ropa no se deforma), ladea la cabeza y da un saltito
  celebrar: {
    cabeza: [-0.1, 0.12],
    brazoL: [-0.15, 0.15],
    antebrazoL: [-0.2, 0.95],
    brazoD: [-0.1, 0.1]
  },
  retrato: {
    torso: [0, -0.03],
    cabeza: [-0.06, 0.1],
    brazoL: [-0.35, -0.38],
    antebrazoL: [-0.3, 0.08],
    brazoD: [-0.35, 0.38],
    antebrazoD: [-0.3, -0.08],
    musloD: [-0.12, 0],
    piernaD: [0.05, 0],
    MusloL: [0.06, 0]
  }
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
    // La cabeza vuelve al cuerpo mientras se recalcula (después se engancha al hueso)
    if (this.headGroup.parent !== this.bodyGroup) this.bodyGroup.attach(this.headGroup)
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
    if (def.slot === 'body') this._useSkeleton(obj, old)
    else this._bindToSkeleton(obj)
    this._applyHides()
    this._applyHairCut()

    if (old) {
      old.removeFromParent()
      disposeObject(old)
    }
  }

  /* ---------- Esqueleto (cuerpo.glb trae los huesos) ----------
     La cabeza (con pelo, ojos y accesorios) se engancha al hueso "cabeza" y la ropa,
     que trae una copia del esqueleto, se une a los huesos del cuerpo. */
  _useSkeleton (body, old) {
    // Si la cabeza colgaba del cuerpo anterior, vuelve al grupo antes de que se libere
    if (old && this.headGroup.parent !== this.bodyGroup) this.bodyGroup.attach(this.headGroup)
    this.bones = {}
    body.traverse(o => { if (o.isBone) this.bones[o.name] = o })
    const head = this.bones.cabeza
    if (!head) { this.bones = null; return }
    this.root.updateMatrixWorld(true)
    head.attach(this.headGroup)
    // Pose de reposo y ejes de giro (en el espacio de cada hueso) para la animación
    this.rest = {}
    Object.values(this.bones).forEach(b => {
      const inv = b.getWorldQuaternion(new THREE.Quaternion()).invert()
      this.rest[b.name] = {
        q: b.quaternion.clone(),
        x: new THREE.Vector3(1, 0, 0).applyQuaternion(inv), // asentir (adelante/atrás)
        z: new THREE.Vector3(0, 0, 1).applyQuaternion(inv) // inclinar a los lados
      }
    })
    Object.entries(this.parts).forEach(([slot, p]) => { if (slot !== 'body') this._bindToSkeleton(p) })
  }

  _bindToSkeleton (obj) {
    if (!this.bones) return
    obj.traverse(m => {
      if (!m.isSkinnedMesh) return
      const bones = m.skeleton.bones.map(b => this.bones[b.name])
      if (bones.every(Boolean)) m.bind(new THREE.Skeleton(bones, m.skeleton.boneInverses), m.bindMatrix)
    })
  }

  /** Gira un hueso desde su reposo: nod alrededor del eje x del mundo, tilt alrededor del z. */
  _pose (name, nod, tilt) {
    const b = this.bones[name]
    const r = this.rest[name]
    if (!b || !r) return
    b.quaternion.copy(r.q)
      .multiply(_q.setFromAxisAngle(r.x, nod))
      .multiply(_q.setFromAxisAngle(r.z, tilt))
  }

  /** Pose fija para retratos (sin animación). nod/tilt en radianes por hueso. */
  setPose (name, k = 1) {
    if (!this.bones) return
    Object.keys(this.rest).forEach(n => this._pose(n, 0, 0))
    Object.entries(POSES[name] || {}).forEach(([bone, [nod, tilt]]) => this._pose(bone, nod * k, tilt * k))
  }

  /** Pasa a una pose con animación y la mantiene (pausa el movimiento de reposo). */
  playPose (name, { duration = 0.45, hold = 0.6 } = {}) {
    if (!this.bones) return Promise.resolve()
    this.posing = name
    const blend = { k: 0 }
    return new Promise(resolve => {
      gsap.timeline({ onComplete: resolve })
        .to(blend, { k: 1, duration, ease: 'back.out(2.2)', onUpdate: () => this.setPose(name, blend.k) })
        // Saltito de todo el personaje (no deforma nada)
        .to(this.bodyGroup.position, { y: 0.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 }, 0.1)
        .to({}, { duration: hold })
    })
  }

  /** Vuelve de la pose al reposo y reanuda el movimiento. */
  releasePose (duration = 0.5) {
    const name = this.posing
    if (!name || !this.bones) return
    const blend = { k: 1 }
    gsap.to(blend, {
      k: 0, duration, ease: 'power2.inOut',
      onUpdate: () => this.setPose(name, blend.k),
      onComplete: () => { this.posing = null }
    })
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

  /** Animación de reposo con los huesos, sin flotar (sin parpadeo: los ojos son mapas UV). */
  update (t) {
    if (!this.animated || !this.dims) return
    if (this.posing) {
      // Durante una pose (p. ej. al finalizar) no se mueven los huesos
    } else if (this.bones) {
      // Con los pies en el suelo: respira el torso, los brazos se mecen y la cabeza se ladea
      this._pose('torso', Math.sin(t * 2.1) * 0.012, 0)
      // Los nombres pierden el punto al cargar el .glb: "brazo.L" → "brazoL"
      this._pose('brazoL', 0, Math.sin(t * 1.6) * 0.07)
      this._pose('brazoD', 0, -Math.sin(t * 1.6 + 0.5) * 0.07)
      this._pose('cabeza', Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.9) * 0.05)
    } else {
      this.headGroup.rotation.z = Math.sin(t * 0.9) * 0.035
      this.headGroup.rotation.x = Math.sin(t * 0.7) * 0.02
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
