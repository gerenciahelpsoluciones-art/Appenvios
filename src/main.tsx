import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Tras publicar una versión nueva, una pestaña abierta de antes pide módulos que ya no existen:
// se recarga una vez para traer la versión actual.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('hs_recargado_por_version')) return
  sessionStorage.setItem('hs_recargado_por_version', '1')
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
