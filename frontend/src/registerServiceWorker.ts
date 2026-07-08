const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || (!import.meta.env.PROD && !isLocalhost)) {
    return
  }

  const register = () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error)
    })
  }

  if (document.readyState === 'complete') {
    register()
    return
  }

  window.addEventListener('load', register)
}
