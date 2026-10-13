import { store } from './store.js'

/* Sonidos suaves sintetizados con Web Audio (no requieren archivos) y
   música de ambiente en bucle (static/audio/ambiente.mp3).
   El interruptor silencia la música y los tonos del estudio; el sonido de los
   botones principales (button) suena siempre, como respuesta al clic. */

let ctx = null
let music = null
const listeners = new Set()

const MUSIC_SRC = 'audio/ambiente.mp3'
const MUSIC_VOLUME = 0.28
/* Efectos con archivo. Suenan siempre: son la respuesta al clic. */
const FX = {
  button: { src: 'audio/boton.mp3', volume: 0.6 },   // "¡Hacer mi avatar!"
  confirm: { src: 'audio/confirmar.mp3', volume: 0.7 } // "Terminar avatar"
}
const fxCache = new Map()
const TONES = {
  pop: { notes: [660, 880], step: 0.05, dur: 0.09 },
  tab: { notes: [520], step: 0.05, dur: 0.06 },
  soft: { notes: [440, 392], step: 0.06, dur: 0.1 },
  success: { notes: [523, 659, 784], step: 0.09, dur: 0.16 }
}

function audio () {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

let waiting = false

/** El navegador bloquea el audio hasta que la persona interactúa:
    se espera al primer clic o tecla y se intenta de nuevo. */
function waitForGesture () {
  if (waiting) return
  waiting = true
  const once = () => {
    window.removeEventListener('pointerdown', once)
    window.removeEventListener('keydown', once)
    waiting = false
    /* Se espera al final del clic: si ese mismo clic fue el del botón de
       silencio, manda lo que la persona acaba de elegir, no el arranque. */
    setTimeout(() => { if (sound.enabled) sound.syncMusic() }, 0)
  }
  window.addEventListener('pointerdown', once)
  window.addEventListener('keydown', once)
}

function track () {
  if (!music) {
    music = document.createElement('audio')
    music.src = MUSIC_SRC
    music.loop = true
    music.volume = MUSIC_VOLUME
    music.preload = 'auto'
    document.body.appendChild(music)
  }
  return music
}

export const sound = {
  get enabled () { return store.flag('sound') !== false },

  toggle () {
    const value = store.flag('sound', !this.enabled)
    this.syncMusic()
    listeners.forEach(fn => fn(this.enabled))
    return value
  },

  /** Avisa a la interfaz (botón del encabezado, estudio) cuando cambia. */
  onChange (fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  /** Arranca o detiene la música según el interruptor.
      Los navegadores solo dejan sonar tras la primera interacción: si la
      reproducción es rechazada, se vuelve a intentar con el primer clic. */
  syncMusic () {
    const m = track()
    if (!this.enabled) return m.pause()
    const attempt = m.play()
    if (attempt && attempt.catch) {
      attempt.catch(err => {
        /* AbortError = se pausó mientras arrancaba; no hace falta reintentar. */
        if (err && err.name !== 'AbortError' && this.enabled) waitForGesture()
      })
    }
  },

  /** Efecto de un botón (ver FX). Es retroalimentación de la interacción, así
      que suena siempre: el interruptor solo manda sobre la música y los tonos. */
  fx (name) {
    const def = FX[name]
    if (!def) return
    let el = fxCache.get(name)
    if (!el) {
      el = new Audio(def.src)
      el.volume = def.volume
      el.preload = 'auto'
      fxCache.set(name, el)
    }
    try {
      el.currentTime = 0
      const p = el.play()
      if (p && p.catch) p.catch(() => {})
    } catch (e) { /* audio no disponible */ }
  },

  play (name = 'pop') {
    if (!this.enabled) return
    const tone = TONES[name]
    if (!tone) return
    try {
      const a = audio()
      tone.notes.forEach((f, i) => {
        const t = a.currentTime + i * tone.step
        const o = a.createOscillator()
        const g = a.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(f, t)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.012)
        g.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur)
        o.connect(g).connect(a.destination)
        o.start(t)
        o.stop(t + tone.dur + 0.02)
      })
    } catch (e) { /* audio no disponible */ }
  }
}
