export const storage = {
  get<T = unknown>(key: string): T | null {
    try {
      const v = localStorage.getItem(key)
      return v ? (JSON.parse(v) as T) : null
    } catch {
      return null
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
    }
  },
}
