/* Lectura/escritura segura en localStorage (no falla en modo privado). */
export const storage = {
  get (key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch (e) {
      return fallback
    }
  },
  set (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      return false
    }
  },
  remove (key) {
    try { localStorage.removeItem(key) } catch (e) { /* sin acceso */ }
  }
}
