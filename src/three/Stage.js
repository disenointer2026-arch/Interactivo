import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import gsap from 'gsap'
import { Avatar } from './Avatar.js'
import { createEnvironment } from './Environment.js'
import { SCENE } from '../data/sceneConfig.js'

/* ==========================================================================
   STAGE: un único renderer que se "mueve" entre páginas.
   Inicio (showcase), personalización (edit) y vista final (final)
   comparten la misma escena y el mismo avatar.
   ========================================================================== */

const CAM = SCENE.camera

export class Stage {
  constructor () {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor(0x000000, 0)

    this.canvas = this.renderer.domElement
    this.canvas.className = 'stage-canvas'
    this.canvas.setAttribute('role', 'img')
    this.canvas.setAttribute('aria-label', 'Vista 3D de tu avatar sobre una pequeña isla. Arrastra para girar.')
    this.canvas.tabIndex = -1

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(CAM.fov, 1, 0.1, 60)
    this.camera.position.set(...CAM.presets.full.pos)

    this.controls = new OrbitControls(this.camera, this.canvas)
    Object.assign(this.controls, {
      enableDamping: true,
      dampingFactor: 0.07,
      enablePan: false,
      rotateSpeed: 0.6,
      zoomSpeed: 0.6,
      minDistance: CAM.minDistance,
      maxDistance: CAM.maxDistance,
      minPolarAngle: 0.35,
      maxPolarAngle: 1.52,
      autoRotateSpeed: 1.1
    })
    this.controls.target.set(...CAM.presets.full.target)

    this._lights()
    this.environment = createEnvironment()
    this.scene.add(this.environment.group)
    this.avatar = new Avatar({ animated: true })
    this.scene.add(this.avatar.root)
    this._sparkles()

    this.clock = new THREE.Clock()
    this.container = null
    this.mode = 'edit'
    this.tick = this.tick.bind(this)
    this.resizeObserver = new ResizeObserver(() => this.resize())
  }

  async init (config) {
    await this.avatar.build(config)
    this.ready = true
  }

  _lights () {
    const L = SCENE.lights
    this.scene.add(new THREE.HemisphereLight(L.sky, L.ground, L.hemiIntensity))
    const key = new THREE.DirectionalLight(L.key, L.keyIntensity)
    key.position.set(3, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3.2
    key.shadow.camera.right = 3.2
    key.shadow.camera.top = 3.2
    key.shadow.camera.bottom = -3.2
    key.shadow.camera.near = 1
    key.shadow.camera.far = 16
    key.shadow.bias = -0.0008
    key.shadow.normalBias = 0.02
    key.shadow.radius = 4
    this.scene.add(key)
    const fill = new THREE.DirectionalLight(L.fill, L.fillIntensity)
    fill.position.set(-4, 3, -2)
    this.scene.add(fill)
  }

  _sparkles () {
    this.sparkleGroup = new THREE.Group()
    const geo = new THREE.OctahedronGeometry(0.035, 0)
    const colors = ['#FFE08A', '#FFFFFF', '#F7B7C4', '#BFE3B0', '#E60012']
    this.sparkles = []
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0 }))
      m.visible = false
      this.sparkles.push(m)
      this.sparkleGroup.add(m)
    }
    this.scene.add(this.sparkleGroup)
  }

  /** Pequeña explosión de destellos donde cambió una pieza (feedback visual). */
  sparkleAt (slot) {
    const center = this.avatar.getSlotCenter(slot)
    this.sparkles.forEach((m, i) => {
      gsap.killTweensOf([m.position, m.scale, m.material])
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 - 0.2, Math.random() * 0.6).normalize()
      m.visible = true
      m.position.copy(center)
      m.scale.setScalar(0.6 + Math.random() * 0.8)
      m.material.opacity = 1
      gsap.to(m.position, { x: center.x + dir.x * 0.45, y: center.y + dir.y * 0.45, z: center.z + dir.z * 0.45, duration: 0.7, ease: 'power2.out' })
      gsap.to(m.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.7, ease: 'power1.in' })
      gsap.to(m.material, { opacity: 0, duration: 0.7, delay: 0.1, onComplete: () => { m.visible = false } })
    })
  }

  /* ---------- Montaje en la página ---------- */
  attach (container, mode = 'edit') {
    this.detach()
    this.container = container
    container.appendChild(this.canvas)
    this.resizeObserver.observe(container)
    this.resize()
    this.setMode(mode, false)
    this.clock.getDelta()
    this.renderer.setAnimationLoop(this.tick)
  }

  detach () {
    if (!this.container) return
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.unobserve(this.container)
    this.canvas.remove()
    this.container = null
  }

  resize () {
    if (!this.container) return
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  setMode (mode, animate = true) {
    this.mode = mode
    const c = this.controls
    c.enableZoom = mode !== 'showcase'
    c.enableRotate = true
    c.autoRotate = mode === 'showcase' || mode === 'final'
    c.autoRotateSpeed = mode === 'final' ? 0.8 : 1.1
    this.focus(mode === 'showcase' ? 'showcase' : mode === 'final' ? 'final' : 'full', animate ? 1.2 : 0)
  }

  /** Mueve la cámara suavemente a un encuadre (ver SCENE.camera.presets). */
  focus (name, duration = 1.1) {
    const p = CAM.presets[name] || CAM.presets.full
    const target = new THREE.Vector3(...p.target)
    const pos = new THREE.Vector3(...p.pos)
    // En pantallas verticales alejamos un poco la cámara para que quepa el avatar
    const aspect = this.camera.aspect || 1
    if (aspect < 0.85) pos.sub(target).multiplyScalar(Math.min(1.6, 0.85 / aspect + 0.25)).add(target)
    gsap.killTweensOf([this.camera.position, this.controls.target])
    if (!duration) {
      this.camera.position.copy(pos)
      this.controls.target.copy(target)
      this.controls.update()
      return
    }
    gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration, ease: 'power3.inOut' })
    gsap.to(this.controls.target, { x: target.x, y: target.y, z: target.z, duration, ease: 'power3.inOut' })
  }

  /** Zoom con botones (respeta los límites de OrbitControls). */
  zoom (factor) {
    const t = this.controls.target
    const offset = this.camera.position.clone().sub(t)
    const len = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance)
    offset.setLength(len).add(t)
    gsap.to(this.camera.position, { x: offset.x, y: offset.y, z: offset.z, duration: 0.6, ease: 'power2.out' })
  }

  setAutoRotate (on) {
    this.controls.autoRotate = on
    return on
  }

  tick () {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime
    this.controls.update(dt)
    this.avatar.update(t)
    this.environment.update(t)
    this.renderer.render(this.scene, this.camera)
  }
}

/* ---------- Singleton ---------- */
let stagePromise = null
let failed = false

export function webglAvailable () {
  if (failed) return false
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch (e) {
    return false
  }
}

/** Devuelve la instancia única del escenario (o null si no hay WebGL). */
export function getStage (config) {
  if (stagePromise) return stagePromise
  if (!webglAvailable()) { failed = true; return Promise.resolve(null) }
  stagePromise = (async () => {
    try {
      const s = new Stage()
      await s.init(config)
      return s
    } catch (err) {
      console.error('[stage] No se pudo iniciar WebGL', err)
      failed = true
      return null
    }
  })()
  return stagePromise
}
