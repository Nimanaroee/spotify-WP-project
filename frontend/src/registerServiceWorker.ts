const APP_CACHE_PREFIX = 'music-app-'
const DEV_RELOAD_KEY = 'music-app-service-worker-cleanup'

async function clearAppCaches(): Promise<void> {
  if (!('caches' in window)) {
    return
  }

  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith(APP_CACHE_PREFIX))
      .map((cacheName) => caches.delete(cacheName)),
  )
}

async function unregisterServiceWorkers(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  const hadRegistrations = registrations.length > 0
  await Promise.all(registrations.map((registration) => registration.unregister()))
  return hadRegistrations
}

export async function prepareServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return true
  }

  if (import.meta.env.DEV) {
    const hadController = Boolean(navigator.serviceWorker.controller)
    const hadRegistrations = await unregisterServiceWorkers()
    await clearAppCaches()

    if (
      (hadController || hadRegistrations) &&
      sessionStorage.getItem(DEV_RELOAD_KEY) !== 'done'
    ) {
      sessionStorage.setItem(DEV_RELOAD_KEY, 'done')
      window.location.reload()
      return false
    }

    sessionStorage.removeItem(DEV_RELOAD_KEY)
    return true
  }

  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch (error) {
    console.error('Service worker registration failed:', error)
  }

  return true
}
