export function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`lumora:${key}`)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function savePref(key: string, value: unknown) {
  try {
    localStorage.setItem(`lumora:${key}`, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode / quota); preference stays in memory
  }
}
