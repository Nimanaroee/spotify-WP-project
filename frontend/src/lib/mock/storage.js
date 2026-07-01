/**
 * Generic localStorage wrapper
 */
export const storage = {
  get(key) {
    try {
      const v = localStorage.getItem(key)
      return v ? JSON.parse(v) : null
    } catch (e) {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) {}
  },
}
