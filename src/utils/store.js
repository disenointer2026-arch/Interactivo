import { DEFAULT_AVATAR, sanitizeAvatar, resolveHides } from '../data/avatarOptions.js'
import { storage } from './storage.js'

/* ==========================================================================
   ESTADO DE LA EXPERIENCIA
   - avatar actual + historial para deshacer/rehacer
   - borrador automático y "Guardar creación" en localStorage
   - perfil de la tarjeta, sesión simulada y último pedido
   ========================================================================== */

const KEYS = {
  draft: 'mxac:draft',
  saved: 'mxac:saved',
  profile: 'mxac:profile',
  order: 'mxac:order',
  flags: 'mxac:flags'
}

const HISTORY_LIMIT = 60

class Store {
  constructor () {
    const saved = storage.get(KEYS.saved)
    const draft = storage.get(KEYS.draft)
    this.state = sanitizeAvatar(draft || (saved && saved.avatar))
    this.savedAt = saved ? saved.savedAt : null
    this.savedSnapshot = saved ? JSON.stringify(sanitizeAvatar(saved.avatar)) : null
    this.past = []
    this.future = []
    this.listeners = new Set()
    this.profile = { name: '', birthDay: '', birthMonth: '', theme: 'spring', ...(storage.get(KEYS.profile) || {}) }
    this.order = storage.get(KEYS.order)
    this.flags = storage.get(KEYS.flags, {})
    this.session = null // sesión simulada, solo en memoria
  }

  subscribe (fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  _emit (meta) {
    storage.set(KEYS.draft, this.state)
    this.listeners.forEach(fn => fn(this.state, meta))
  }

  _push () {
    this.past.push(this.state)
    if (this.past.length > HISTORY_LIMIT) this.past.shift()
    this.future = []
  }

  set (key, value) {
    // Elegir la prenda ya guardada pero tapada (camiseta con overol) también cuenta como cambio
    const next = resolveHides({ ...this.state, [key]: value }, key)
    if (Object.keys(next).every(k => next[k] === this.state[k])) return false
    this._push()
    this.state = next
    this._emit({ type: 'set', key })
    return true
  }

  replace (next, type = 'replace') {
    const clean = sanitizeAvatar(next)
    if (JSON.stringify(clean) === JSON.stringify(this.state)) return false
    this._push()
    this.state = clean
    this._emit({ type })
    return true
  }

  undo () {
    if (!this.past.length) return false
    this.future.push(this.state)
    this.state = this.past.pop()
    this._emit({ type: 'undo' })
    return true
  }

  redo () {
    if (!this.future.length) return false
    this.past.push(this.state)
    this.state = this.future.pop()
    this._emit({ type: 'redo' })
    return true
  }

  reset () {
    return this.replace(DEFAULT_AVATAR, 'reset')
  }

  get canUndo () { return this.past.length > 0 }
  get canRedo () { return this.future.length > 0 }

  /** "Guardar creación" */
  save () {
    const data = { avatar: this.state, savedAt: Date.now() }
    const ok = storage.set(KEYS.saved, data)
    if (ok) {
      this.savedAt = data.savedAt
      this.savedSnapshot = JSON.stringify(this.state)
    }
    return ok
  }

  get hasSaved () { return !!this.savedAt }
  get isSaved () { return this.savedSnapshot === JSON.stringify(this.state) }

  setProfile (patch) {
    this.profile = { ...this.profile, ...patch }
    storage.set(KEYS.profile, this.profile)
  }

  setOrder (order) {
    this.order = order
    storage.set(KEYS.order, order)
  }

  flag (name, value) {
    if (value === undefined) return this.flags[name]
    this.flags = { ...this.flags, [name]: value }
    storage.set(KEYS.flags, this.flags)
    return value
  }
}

export const store = new Store()
