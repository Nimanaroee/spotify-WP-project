import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { prepareServiceWorker } from './registerServiceWorker'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

const rootElement = root

async function bootstrap(): Promise<void> {
  const shouldRender = await prepareServiceWorker()

  if (shouldRender) {
    createRoot(rootElement).render(<App />)
  }
}

void bootstrap()
